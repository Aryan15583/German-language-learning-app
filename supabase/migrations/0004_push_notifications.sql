-- Zwei Herzen ♡: message notifications, even when the app is closed (Web Push).
--
-- Privacy: messages stay end-to-end encrypted. The server never knows what a
-- message says or who sent it. When something lands in a mailbox, it only pings
-- that mailbox's phones with an empty "you have a new message" push.
--
-- Run this whole file once in Supabase → SQL Editor. Then create the "notify"
-- Edge Function (supabase/functions/notify/index.ts) — see supabase/PUSH_SETUP.md.

create extension if not exists pg_net with schema extensions;

-- Phones that want a ping when their mailbox gets a message.
create table if not exists public.push_subs (
  id bigint generated always as identity primary key,
  mailbox text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint push_subs_mailbox_format check (mailbox ~ '^[A-Za-z0-9_-]{43}$'),
  constraint push_subs_endpoint_format check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  constraint push_subs_keys_format check (p256dh ~ '^[A-Za-z0-9_=-]{40,200}$' and auth ~ '^[A-Za-z0-9_=-]{10,100}$')
);
create index if not exists push_subs_mailbox_idx on public.push_subs (mailbox);
alter table public.push_subs enable row level security;
revoke all on table public.push_subs from public, anon, authenticated;

-- The server's own Web Push key pair (made automatically by the notify function).
create table if not exists public.push_keys (
  id int primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null,
  created_at timestamptz not null default now()
);
alter table public.push_keys enable row level security;
revoke all on table public.push_keys from public, anon, authenticated;

-- Where the notify function lives (your project's address; change it if you move projects).
create table if not exists public.push_config (
  id int primary key default 1 check (id = 1),
  function_url text not null
);
alter table public.push_config enable row level security;
revoke all on table public.push_config from public, anon, authenticated;
insert into public.push_config (id, function_url)
values (1, 'https://baxsqqytcebvzngvqeiq.supabase.co/functions/v1/notify')
on conflict (id) do nothing;

-- Each message is pinged at most once (stops anyone replaying old pings).
alter table public.relay add column if not exists notified_at timestamptz;

-- Turn notifications on for this phone (or move them to a new mailbox after re-linking).
create or replace function public.push_subscribe(p_mailbox text, p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_mailbox is null or p_mailbox !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid mailbox' using errcode = '22023';
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000 then
    raise exception 'invalid endpoint' using errcode = '22023';
  end if;
  if p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_=-]{40,200}$' or p_auth is null or p_auth !~ '^[A-Za-z0-9_=-]{10,100}$' then
    raise exception 'invalid keys' using errcode = '22023';
  end if;
  insert into public.push_subs (mailbox, endpoint, p256dh, auth)
  values (p_mailbox, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set mailbox = excluded.mailbox, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
  -- A mailbox has at most 5 phones; the oldest drop off.
  delete from public.push_subs
  where mailbox = p_mailbox
    and id not in (select id from public.push_subs where mailbox = p_mailbox order by created_at desc limit 5);
end;
$$;

-- Turn notifications off for this phone.
create or replace function public.push_unsubscribe(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subs where endpoint = p_endpoint;
$$;

revoke all on function public.push_subscribe(text, text, text, text) from public;
revoke all on function public.push_unsubscribe(text) from public;
grant execute on function public.push_subscribe(text, text, text, text) to anon, authenticated;
grant execute on function public.push_unsubscribe(text) to anon, authenticated;

-- New message in a mailbox with subscribed phones → ask the notify function to ping them.
create or replace function public.relay_ping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target text;
begin
  if not exists (select 1 from public.push_subs where mailbox = new.mailbox) then
    return new;
  end if;
  select function_url into target from public.push_config where id = 1;
  if target is null then
    return new;
  end if;
  perform net.http_post(
    url := target,
    body := jsonb_build_object('id', new.id, 'mailbox', new.mailbox),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return new;
exception when others then
  -- Notifications must never stop a message from being delivered.
  return new;
end;
$$;

drop trigger if exists relay_ping on public.relay;
create trigger relay_ping after insert on public.relay for each row execute function public.relay_ping();
