-- Tests for 0009_android_app.sql (Firebase addresses for the Android app).
do $$
declare tok text := 'fcm:' || repeat('AbC_d-9:', 20); n int;
begin
  set local role anon;
  perform public.push_subscribe(repeat('m', 43), tok, null, null);
  perform public.push_set_reminder(tok, null, null, 1200, 'Asia/Kolkata');
  -- Web push addresses still need their keys.
  begin perform public.push_subscribe(repeat('m', 43), 'https://fcm.googleapis.com/fcm/send/x', null, null); raise exception 'web push without keys accepted';
  exception when sqlstate '22023' then null; end;
  -- Junk "tokens" are refused.
  begin perform public.push_subscribe(repeat('m', 43), 'fcm:short', null, null); raise exception 'short token accepted';
  exception when sqlstate '22023' then null; end;
  begin perform public.push_subscribe(repeat('m', 43), 'fcm:' || repeat('a', 120) || '<script>', null, null); raise exception 'odd token accepted';
  exception when sqlstate '22023' then null; end;
  reset role;
  select count(*) into n from public.push_subs where endpoint = tok and mailbox = repeat('m', 43) and remind_minute = 1200;
  if n <> 1 then raise exception 'app address not saved (%)', n; end if;
  -- The trigger pings the app's mailbox like any other.
  delete from net.calls;
  set local role anon;
  perform public.relay_send(repeat('m', 43), repeat('z', 40));
  reset role;
  select count(*) into n from net.calls;
  if n <> 1 then raise exception 'no ping for the app (%)', n; end if;
  raise notice 'android_test: all good';
end $$;
