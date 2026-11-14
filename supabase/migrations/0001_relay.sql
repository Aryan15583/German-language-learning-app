-- Zwei Herzen ♡ Until Berlin: zero-knowledge message relay.
--
-- The app end-to-end encrypts every message on the phone (XChaCha20-Poly1305,
-- key known only to the two partners) before it reaches this database.
-- The database only stores opaque ciphertext in "mailboxes" whose names are
-- derived from the couple key, so they can't be guessed or listed.
--
-- Clients (the public anon key) get NO table access at all, only these two
-- functions: drop a message into a mailbox, and read a mailbox by its exact name.

create table if not exists public.relay (
  id bigint generated always as identity primary key,
  mailbox text not null,
  payload text not null,
  created_at timestamptz not null default now(),
  constraint relay_mailbox_format check (mailbox ~ '^[A-Za-z0-9_-]{43}$'),
  constraint relay_payload_format check (payload ~ '^[A-Za-z0-9_-]+$' and char_length(payload) between 40 and 8000)
);

create index if not exists relay_mailbox_id_idx on public.relay (mailbox, id);
create index if not exists relay_created_at_idx on public.relay (created_at);

-- Row level security on, and no policies: direct reads/writes are denied.
alter table public.relay enable row level security;
revoke all on table public.relay from public, anon, authenticated;

-- Drop an encrypted message into a mailbox.
create or replace function public.relay_send(p_mailbox text, p_payload text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  if p_mailbox is null or p_mailbox !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid mailbox' using errcode = '22023';
  end if;
  if p_payload is null or p_payload !~ '^[A-Za-z0-9_-]+$' or char_length(p_payload) not between 40 and 8000 then
    raise exception 'invalid payload' using errcode = '22023';
  end if;
  -- Rate limits: protect a mailbox from flooding.
  if (select count(*) from public.relay where mailbox = p_mailbox and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'slow down' using errcode = '54000';
  end if;
  if (select count(*) from public.relay where mailbox = p_mailbox) >= 2000 then
    raise exception 'mailbox full' using errcode = '54000';
  end if;
  insert into public.relay (mailbox, payload) values (p_mailbox, p_payload) returning id into new_id;
  -- Opportunistic cleanup: nothing is kept longer than 30 days.
  delete from public.relay where created_at < now() - interval '30 days';
  return new_id;
end;
$$;

-- Read a mailbox by its exact name, after a cursor. There is no way to list mailboxes.
create or replace function public.relay_fetch(p_mailbox text, p_after bigint default 0)
returns table (id bigint, payload text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_mailbox is null or p_mailbox !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid mailbox' using errcode = '22023';
  end if;
  return query
    select r.id, r.payload
    from public.relay r
    where r.mailbox = p_mailbox and r.id > coalesce(p_after, 0)
    order by r.id
    limit 100;
end;
$$;

revoke all on function public.relay_send(text, text) from public;
revoke all on function public.relay_fetch(text, bigint) from public;
grant execute on function public.relay_send(text, text) to anon, authenticated;
grant execute on function public.relay_fetch(text, bigint) to anon, authenticated;
