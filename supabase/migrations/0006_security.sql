-- Zwei Herzen ♡: security hardening (run after 0004 and 0005; safe to run more than once).
--
-- 1. Notification addresses must belong to a real push service (Google, Mozilla, Microsoft, Apple),
--    so nobody can make your notify function send requests to other websites.
-- 2. Hard limits, so nobody can fill the notification table with junk.
-- 3. relay_clear: the app empties its pairing mailboxes once two phones are linked.

create or replace function public.push_endpoint_ok(p_endpoint text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_endpoint is not null
     and char_length(p_endpoint) <= 1000
     and p_endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.notify\.windows\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com)/';
$$;

-- Forget anything already saved that isn't a real push service.
delete from public.push_subs where not public.push_endpoint_ok(endpoint);

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
  if not public.push_endpoint_ok(p_endpoint) then
    raise exception 'invalid endpoint' using errcode = '22023';
  end if;
  if p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_=-]{40,200}$' or p_auth is null or p_auth !~ '^[A-Za-z0-9_=-]{10,100}$' then
    raise exception 'invalid keys' using errcode = '22023';
  end if;
  if not exists (select 1 from public.push_subs where endpoint = p_endpoint)
     and (select count(*) from public.push_subs) >= 200 then
    raise exception 'too many phones' using errcode = '54000';
  end if;
  insert into public.push_subs (mailbox, endpoint, p256dh, auth)
  values (p_mailbox, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set mailbox = excluded.mailbox, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
  delete from public.push_subs
  where mailbox = p_mailbox
    and id not in (select id from public.push_subs where mailbox = p_mailbox order by created_at desc limit 5);
end;
$$;

create or replace function public.push_set_reminder(p_endpoint text, p_p256dh text, p_auth text, p_minute int, p_tz text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.push_endpoint_ok(p_endpoint) then
    raise exception 'invalid endpoint' using errcode = '22023';
  end if;
  if p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_=-]{40,200}$' or p_auth is null or p_auth !~ '^[A-Za-z0-9_=-]{10,100}$' then
    raise exception 'invalid keys' using errcode = '22023';
  end if;
  if p_minute is not null and (p_minute < 0 or p_minute > 1439) then
    raise exception 'invalid time' using errcode = '22023';
  end if;
  if p_minute is not null and (p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz)) then
    raise exception 'invalid time zone' using errcode = '22023';
  end if;
  if not exists (select 1 from public.push_subs where endpoint = p_endpoint) then
    if p_minute is null then
      return; -- turning off a reminder that was never saved: nothing to do
    end if;
    if (select count(*) from public.push_subs) >= 200 then
      raise exception 'too many phones' using errcode = '54000';
    end if;
  end if;
  insert into public.push_subs (mailbox, endpoint, p256dh, auth, remind_minute, remind_tz)
  values (null, p_endpoint, p_p256dh, p_auth, p_minute, p_tz)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, remind_minute = excluded.remind_minute, remind_tz = excluded.remind_tz;
end;
$$;

-- Empty a mailbox (pairing mailboxes, once linked). Mailbox names are unguessable.
create or replace function public.relay_clear(p_mailbox text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_mailbox is null or p_mailbox !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid mailbox' using errcode = '22023';
  end if;
  delete from public.relay where mailbox = p_mailbox;
end;
$$;

revoke all on function public.push_endpoint_ok(text) from public, anon, authenticated;
revoke all on function public.relay_clear(text) from public;
grant execute on function public.relay_clear(text) to anon, authenticated;
revoke all on function public.push_subscribe(text, text, text, text) from public;
revoke all on function public.push_set_reminder(text, text, text, int, text) from public;
grant execute on function public.push_subscribe(text, text, text, text) to anon, authenticated;
grant execute on function public.push_set_reminder(text, text, text, int, text) to anon, authenticated;

notify pgrst, 'reload schema';
