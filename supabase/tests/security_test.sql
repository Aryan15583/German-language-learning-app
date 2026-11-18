-- Tests for 0006_security.sql (after 0001, 0004, 0005, 0006).
do $$
declare
  n int;
  k text := repeat('k', 87);
  a text := repeat('a', 22);
  box text := repeat('d', 43);
begin
  set local role anon;
  -- Only real push services are accepted.
  perform public.push_subscribe(box, 'https://fcm.googleapis.com/fcm/send/ok1', k, a);
  perform public.push_subscribe(box, 'https://updates.push.services.mozilla.com/wpush/v2/ok2', k, a);
  perform public.push_set_reminder('https://wns2-par02p.notify.windows.com/w/?token=ok3', k, a, 600, 'UTC');
  perform public.push_set_reminder('https://web.push.apple.com/ok4', k, a, 600, 'UTC');
  foreach a in array array['https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://127.0.0.1/x', 'http://fcm.googleapis.com/x', 'https://notify.windows.com.evil.example/x'] loop
    begin perform public.push_subscribe(box, a, k, repeat('a', 22)); raise exception 'accepted endpoint %', a;
    exception when sqlstate '22023' then null; end;
    begin perform public.push_set_reminder(a, k, repeat('a', 22), 600, 'UTC'); raise exception 'accepted reminder endpoint %', a;
    exception when sqlstate '22023' then null; end;
  end loop;
  a := repeat('a', 22);
  -- Turning off a reminder that was never saved adds nothing.
  perform public.push_set_reminder('https://fcm.googleapis.com/fcm/send/never', k, a, null, null);
  reset role;
  if exists (select 1 from public.push_subs where endpoint like '%/never') then raise exception 'saved a row for a no-op'; end if;

  -- Hard cap: at most 200 phones in total.
  insert into public.push_subs (mailbox, endpoint, p256dh, auth)
  select null, 'https://fcm.googleapis.com/fcm/send/fill' || g, k, a from generate_series(1, 200 - (select count(*) from public.push_subs)) g;
  set local role anon;
  begin perform public.push_subscribe(box, 'https://fcm.googleapis.com/fcm/send/one-too-many', k, a); raise exception 'cap not enforced';
  exception when sqlstate '54000' then null; end;
  begin perform public.push_set_reminder('https://fcm.googleapis.com/fcm/send/one-too-many', k, a, 600, 'UTC'); raise exception 'cap not enforced (reminder)';
  exception when sqlstate '54000' then null; end;
  -- ...but a phone already saved can still update itself.
  perform public.push_subscribe(box, 'https://fcm.googleapis.com/fcm/send/ok1', k, a);

  -- relay_clear empties one mailbox only.
  perform public.relay_send(repeat('e', 43), repeat('x', 40));
  perform public.relay_send(repeat('f', 43), repeat('x', 40));
  perform public.relay_clear(repeat('e', 43));
  reset role;
  select count(*) into n from public.relay where mailbox = repeat('e', 43);
  if n <> 0 then raise exception 'relay_clear left messages'; end if;
  select count(*) into n from public.relay where mailbox = repeat('f', 43);
  if n <> 1 then raise exception 'relay_clear touched another mailbox'; end if;
  delete from public.push_subs where endpoint like '%/fill%';
  raise notice 'security_test: all good';
end $$;
