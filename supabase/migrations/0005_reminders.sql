-- Zwei Herzen ♡: daily learning reminders ("Zeit für Deutsch! 🇩🇪"), even when the app is closed.
-- Needs 0004_push_notifications.sql first. Run this whole file once in Supabase → SQL Editor,
-- and deploy the latest supabase/functions/notify/index.ts (see supabase/PUSH_SETUP.md).
--
-- The server only learns: this phone wants a reminder at 20:00 in Asia/Kolkata, and the date it
-- last learned (so it doesn't nag after you've already practised). Nothing else.

create extension if not exists pg_cron;

-- A phone can want reminders without being linked to a partner.
alter table public.push_subs alter column mailbox drop not null;
alter table public.push_subs add column if not exists remind_minute int check (remind_minute between 0 and 1439);
alter table public.push_subs add column if not exists remind_tz text;
alter table public.push_subs add column if not exists remind_last date;
alter table public.push_subs add column if not exists learned_on date;

-- Turn this phone's daily reminder on (minute of the day, e.g. 20:00 → 1200) or off (null).
create or replace function public.push_set_reminder(p_endpoint text, p_p256dh text, p_auth text, p_minute int, p_tz text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000 then
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
  insert into public.push_subs (mailbox, endpoint, p256dh, auth, remind_minute, remind_tz)
  values (null, p_endpoint, p_p256dh, p_auth, p_minute, p_tz)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, remind_minute = excluded.remind_minute, remind_tz = excluded.remind_tz;
end;
$$;

-- "I learned today" (in my own time zone): no reminder needed today.
create or replace function public.push_learned(p_endpoint text, p_day date)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.push_subs
  set learned_on = greatest(coalesce(learned_on, p_day), p_day)
  where endpoint = p_endpoint and p_day between current_date - 1 and current_date + 1;
$$;

-- For the notify function only: phones whose reminder time is now (within 15 minutes),
-- that haven't learned or been reminded today. Marks them reminded.
create or replace function public.push_take_due_reminders()
returns table (endpoint text, p256dh text, auth text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with due as (
    select s.id, (now() at time zone s.remind_tz)::date as local_day
    from public.push_subs s
    where s.remind_minute is not null
      and s.remind_tz is not null
      -- within 15 minutes after the chosen time (also across midnight)
      and mod((extract(hour from now() at time zone s.remind_tz) * 60 + extract(minute from now() at time zone s.remind_tz))::int - s.remind_minute + 1440, 1440) < 15
  )
  update public.push_subs s
  set remind_last = due.local_day
  from due
  where s.id = due.id
    and (s.remind_last is null or s.remind_last < due.local_day)
    and (s.learned_on is null or s.learned_on < due.local_day)
  returning s.endpoint, s.p256dh, s.auth;
end;
$$;

revoke all on function public.push_set_reminder(text, text, text, int, text) from public;
revoke all on function public.push_learned(text, date) from public;
revoke all on function public.push_take_due_reminders() from public, anon, authenticated;
grant execute on function public.push_set_reminder(text, text, text, int, text) to anon, authenticated;
grant execute on function public.push_learned(text, date) to anon, authenticated;
grant execute on function public.push_take_due_reminders() to service_role;

-- Every 10 minutes, ask the notify function to send any reminders that are due.
do $$
begin
  perform cron.unschedule('zh-reminders') where exists (select 1 from cron.job where jobname = 'zh-reminders');
  perform cron.schedule(
    'zh-reminders',
    '*/10 * * * *',
    $job$ select net.http_post(url := (select function_url from public.push_config where id = 1), body := '{"type":"reminders"}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb) $job$
  );
end $$;
