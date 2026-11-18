-- Tests for 0005_reminders.sql (after 0001, 0004 and 0005; locally with pg_cron/pg_net stand-ins).
do $$
declare
  n int;
  k text := repeat('k', 87);
  a text := repeat('a', 22);
  -- "now" in two zones, as minutes after midnight
  m_utc int := extract(hour from now() at time zone 'UTC') * 60 + extract(minute from now() at time zone 'UTC');
  m_kol int := extract(hour from now() at time zone 'Asia/Kolkata') * 60 + extract(minute from now() at time zone 'Asia/Kolkata');
begin
  set local role anon;
  -- Reminder due now (UTC), one due now (Kolkata), one later today, one off.
  perform public.push_set_reminder('https://push.example/r1', k, a, m_utc, 'UTC');
  perform public.push_set_reminder('https://push.example/r2', k, a, m_kol, 'Asia/Kolkata');
  perform public.push_set_reminder('https://push.example/r3', k, a, (m_utc + 120) % 1440, 'UTC');
  perform public.push_set_reminder('https://push.example/r4', k, a, null, null);
  -- r2 already learned today (in its own zone) → no reminder.
  perform public.push_learned('https://push.example/r2', (now() at time zone 'Asia/Kolkata')::date);

  -- Bad input is refused.
  begin perform public.push_set_reminder('https://push.example/x', k, a, 1440, 'UTC'); raise exception 'accepted minute 1440';
  exception when sqlstate '22023' then null; end;
  begin perform public.push_set_reminder('https://push.example/x', k, a, 600, 'Mars/Base'); raise exception 'accepted bad zone';
  exception when sqlstate '22023' then null; end;

  -- The API can't pull reminders itself.
  begin perform public.push_take_due_reminders(); raise exception 'anon can take reminders';
  exception when insufficient_privilege then null; end;
  reset role;

  select count(*) into n from public.push_take_due_reminders();
  if n <> 1 then raise exception 'expected 1 due reminder, got %', n; end if;
  -- Only once a day.
  select count(*) into n from public.push_take_due_reminders();
  if n <> 0 then raise exception 'reminder sent twice'; end if;
  if not exists (select 1 from public.push_subs where endpoint = 'https://push.example/r1' and remind_last is not null) then raise exception 'r1 not marked'; end if;

  -- Turning a reminder off keeps the phone's chat pings.
  perform public.push_subscribe(repeat('c', 43), 'https://push.example/r3', k, a);
  set local role anon;
  perform public.push_set_reminder('https://push.example/r3', k, a, null, null);
  reset role;
  if not exists (select 1 from public.push_subs where endpoint = 'https://push.example/r3' and mailbox = repeat('c', 43) and remind_minute is null) then
    raise exception 'turning reminder off broke chat pings';
  end if;

  -- The job is scheduled every 10 minutes.
  if not exists (select 1 from cron.job where jobname = 'zh-reminders' and schedule = '*/10 * * * *') then raise exception 'cron job missing'; end if;
  raise notice 'reminders_test: all good';
end $$;
