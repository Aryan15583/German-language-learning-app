-- Tests for 0004_push_notifications.sql. Needs net.http_post (pg_net on Supabase;
-- a recording stand-in, net.calls, when testing locally).
set role anon;
do $$
declare
  box text := repeat('a', 43);
  other text := repeat('b', 43);
  n int;
  denied boolean;
begin
  -- No subscriptions yet: sending a message pings nobody.
  perform public.relay_send(box, repeat('x', 40));
  reset role;
  select count(*) into n from net.calls;
  if n <> 0 then raise exception 'pinged a mailbox with no phones'; end if;
  set role anon;

  -- A phone subscribes; its next message triggers exactly one ping, with no message content.
  perform public.push_subscribe(box, 'https://push.example/1', repeat('k', 87), repeat('a', 22));
  perform public.relay_send(box, repeat('y', 40));
  perform public.relay_send(other, repeat('z', 40));
  reset role;
  select count(*) into n from net.calls;
  if n <> 1 then raise exception 'expected 1 ping, got %', n; end if;
  if exists (select 1 from net.calls where body ? 'payload' or body->>'mailbox' <> box) then raise exception 'ping leaked content or wrong mailbox'; end if;
  set role anon;

  -- Bad input is refused.
  begin perform public.push_subscribe(box, 'http://insecure', repeat('k', 87), repeat('a', 22)); raise exception 'accepted http endpoint';
  exception when sqlstate '22023' then null; end;
  begin perform public.push_subscribe('short', 'https://push.example/2', repeat('k', 87), repeat('a', 22)); raise exception 'accepted bad mailbox';
  exception when sqlstate '22023' then null; end;
  begin perform public.push_subscribe(box, 'https://push.example/2', 'bad keys!', repeat('a', 22)); raise exception 'accepted bad keys';
  exception when sqlstate '22023' then null; end;

  -- At most 5 phones per mailbox; re-subscribing the same phone moves it.
  for i in 2..8 loop perform public.push_subscribe(box, 'https://push.example/' || i, repeat('k', 87), repeat('a', 22)); end loop;
  perform public.push_subscribe(other, 'https://push.example/8', repeat('k', 87), repeat('a', 22));
  reset role;
  select count(*) into n from public.push_subs where mailbox = box;
  if n <> 5 then raise exception 'expected 5 phones, got %', n; end if;
  select count(*) into n from public.push_subs where mailbox = other;
  if n <> 1 then raise exception 'moving a phone failed'; end if;
  set role anon;

  -- Unsubscribe.
  perform public.push_unsubscribe('https://push.example/8');
  reset role;
  select count(*) into n from public.push_subs where endpoint = 'https://push.example/8';
  if n <> 0 then raise exception 'unsubscribe failed'; end if;

  -- The API roles can't read subscriptions, keys or settings directly.
  set role anon;
  denied := false;
  begin perform 1 from public.push_subs; exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'anon can read push_subs'; end if;
  denied := false;
  begin perform 1 from public.push_keys; exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'anon can read push_keys'; end if;
  reset role;

  -- A failing ping never blocks delivery.
  alter function net.http_post(text, jsonb, jsonb) rename to http_post_off;
  set role anon;
  perform public.relay_send(box, repeat('w', 40));
  reset role;
  alter function net.http_post_off(text, jsonb, jsonb) rename to http_post;
  select count(*) into n from public.relay where mailbox = box;
  if n <> 3 then raise exception 'message lost when ping failed (%)', n; end if;
  raise notice 'push_test: all good';
end $$;
reset role;
