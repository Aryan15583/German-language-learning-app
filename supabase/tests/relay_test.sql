-- Security tests for the relay. Run against a throwaway database:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/setup_roles.sql -f supabase/migrations/0001_relay.sql -f supabase/tests/relay_test.sql
-- Every check raises an exception on failure, so the run stops at the first problem.

\set mbox '''AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'''
\set other '''BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'''
\set payload '''ciphertext_ciphertext_ciphertext_ciphertext_xyz'''

set role anon;

-- 1. The app (anon key) can drop and read messages through the functions.
do $$
declare a bigint; b bigint; n int;
begin
  a := public.relay_send('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'ciphertext_ciphertext_ciphertext_ciphertext_one');
  b := public.relay_send('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'ciphertext_ciphertext_ciphertext_ciphertext_two');
  if b <= a then raise exception 'FAIL: ids should increase'; end if;
  select count(*) into n from public.relay_fetch('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 0);
  if n <> 2 then raise exception 'FAIL: expected 2 messages, got %', n; end if;
  select count(*) into n from public.relay_fetch('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', a);
  if n <> 1 then raise exception 'FAIL: cursor should skip read messages, got %', n; end if;
  select count(*) into n from public.relay_fetch('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 0);
  if n <> 0 then raise exception 'FAIL: other mailbox must be empty'; end if;
  raise notice 'PASS send/fetch by exact mailbox with cursor';
end $$;

-- 2. Direct table access is denied (no listing, no reading, no writing, no deleting).
do $$
begin
  begin perform * from public.relay; raise exception 'FAIL: direct select allowed';
  exception when insufficient_privilege then null; end;
  begin insert into public.relay (mailbox, payload) values ('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'ciphertext_ciphertext_ciphertext_ciphertext_bad');
    raise exception 'FAIL: direct insert allowed';
  exception when insufficient_privilege then null; end;
  begin delete from public.relay; raise exception 'FAIL: direct delete allowed';
  exception when insufficient_privilege then null; end;
  begin update public.relay set payload = 'x'; raise exception 'FAIL: direct update allowed';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS direct table access denied';
end $$;

-- 3. Bad input is rejected.
do $$
begin
  begin perform public.relay_send('short', 'ciphertext_ciphertext_ciphertext_ciphertext_xyz'); raise exception 'FAIL: short mailbox';
  exception when invalid_parameter_value then null; end;
  begin perform public.relay_send('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', '<script>alert(1)</script>_padding_padding_padding');
    raise exception 'FAIL: non-base64 payload';
  exception when invalid_parameter_value then null; end;
  begin perform public.relay_send('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', repeat('a', 8001)); raise exception 'FAIL: huge payload';
  exception when invalid_parameter_value then null; end;
  begin perform public.relay_send('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'tiny'); raise exception 'FAIL: tiny payload';
  exception when invalid_parameter_value then null; end;
  begin perform * from public.relay_fetch('%', 0); raise exception 'FAIL: wildcard mailbox';
  exception when invalid_parameter_value then null; end;
  begin perform * from public.relay_fetch(null, 0); raise exception 'FAIL: null mailbox';
  exception when invalid_parameter_value then null; end;
  raise notice 'PASS invalid input rejected';
end $$;

-- 4. Flooding a mailbox is rate limited (30 per minute).
do $$
declare i int; blocked boolean := false;
begin
  for i in 1..40 loop
    begin
      perform public.relay_send('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'ciphertext_ciphertext_ciphertext_ciphertext_' || i);
    exception when program_limit_exceeded then blocked := true; exit;
    end;
  end loop;
  if not blocked then raise exception 'FAIL: no rate limit'; end if;
  if (select count(*) from public.relay_fetch('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 0)) <> 30 then
    raise exception 'FAIL: expected exactly 30 stored';
  end if;
  raise notice 'PASS rate limit at 30 per minute';
end $$;

-- 5. Fetch returns at most 100 rows per call.
reset role;
insert into public.relay (mailbox, payload)
  select 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'ciphertext_ciphertext_ciphertext_ciphertext_' || g from generate_series(1, 150) g;
set role anon;
do $$
begin
  if (select count(*) from public.relay_fetch('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 0)) <> 100 then raise exception 'FAIL: page size'; end if;
  raise notice 'PASS fetch pages at 100';
end $$;

-- 6. Messages older than 30 days are deleted.
reset role;
insert into public.relay (mailbox, payload, created_at)
  values ('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 'ciphertext_ciphertext_ciphertext_ciphertext_old', now() - interval '31 days');
set role anon;
select public.relay_send('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'ciphertext_ciphertext_ciphertext_ciphertext_new');
do $$
begin
  if exists (select 1 from public.relay_fetch('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', 0)) then raise exception 'FAIL: old message kept'; end if;
  raise notice 'PASS 30-day expiry';
end $$;

-- 7. Functions can't be hijacked through search_path.
reset role;
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('relay_send', 'relay_fetch')
      and not (p.proconfig @> array['search_path=""'])
  ) then raise exception 'FAIL: search_path not pinned'; end if;
  raise notice 'PASS search_path pinned';
end $$;

\echo 'ALL RELAY SECURITY TESTS PASSED'
