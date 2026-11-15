-- Security tests for accounts (user_data). Run after setup_roles.sql and the migrations.
-- Two users, Aryan and Shreya; each must only ever see and change their own row.

reset role;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'aryan@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'shreya@example.com')
on conflict do nothing;

-- Aryan signs in and saves his encrypted backup.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
insert into public.user_data (user_id, salt, blob)
  values ('11111111-1111-1111-1111-111111111111', 'saltsaltsaltsalt', 'ciphertext_ciphertext_ciphertext_ciphertext_aryan');

do $$
begin
  -- He can't create a row for someone else.
  begin
    insert into public.user_data (user_id, salt, blob)
      values ('22222222-2222-2222-2222-222222222222', 'saltsaltsaltsalt', 'ciphertext_ciphertext_ciphertext_ciphertext_fake');
    raise exception 'FAIL: inserted a row for another user';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS cannot write another user''s row';
end $$;

-- Shreya signs in and saves hers.
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', false);
insert into public.user_data (user_id, salt, blob)
  values ('22222222-2222-2222-2222-222222222222', 'pepperpepperpepper', 'ciphertext_ciphertext_ciphertext_ciphertext_shreya');

do $$
declare n int;
begin
  select count(*) into n from public.user_data;
  if n <> 1 then raise exception 'FAIL: Shreya sees % rows', n; end if;
  if (select user_id from public.user_data) <> '22222222-2222-2222-2222-222222222222' then raise exception 'FAIL: wrong row visible'; end if;
  update public.user_data set blob = 'ciphertext_ciphertext_ciphertext_ciphertext_hacked' where user_id = '11111111-1111-1111-1111-111111111111';
  delete from public.user_data where user_id = '11111111-1111-1111-1111-111111111111';
  raise notice 'PASS each user sees only their own row';
end $$;

-- Aryan's row is untouched by Shreya's update/delete attempts.
reset role;
do $$
begin
  if (select blob from public.user_data where user_id = '11111111-1111-1111-1111-111111111111') <> 'ciphertext_ciphertext_ciphertext_ciphertext_aryan' then
    raise exception 'FAIL: another user changed Aryan''s row';
  end if;
  raise notice 'PASS other users cannot update or delete your row';
end $$;

-- Moving a row to another user is blocked.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
do $$
begin
  begin
    update public.user_data set user_id = '22222222-2222-2222-2222-222222222222' where user_id = '11111111-1111-1111-1111-111111111111';
    raise exception 'FAIL: row moved to another user';
  exception when insufficient_privilege or unique_violation then null;
  end;
  raise notice 'PASS rows cannot be handed to another user';
end $$;

-- Not signed in (anon key only): no access at all.
set role anon;
select set_config('request.jwt.claims', '', false);
do $$
begin
  begin perform * from public.user_data; raise exception 'FAIL: anon can read accounts';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS anonymous visitors have no access';
end $$;

-- Validation.
reset role;
do $$
begin
  begin
    insert into auth.users (id) values ('33333333-3333-3333-3333-333333333333');
    insert into public.user_data (user_id, salt, blob) values ('33333333-3333-3333-3333-333333333333', 'saltsaltsaltsalt', '<script>alert(1)</script>_padding_padding_padding');
    raise exception 'FAIL: non-base64 blob accepted';
  exception when check_violation then null;
  end;
  raise notice 'PASS only encrypted (base64url) data is accepted';
end $$;

-- Deleting an account deletes its data.
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
do $$
begin
  if exists (select 1 from public.user_data where user_id = '22222222-2222-2222-2222-222222222222') then raise exception 'FAIL: data kept after account deletion'; end if;
  raise notice 'PASS deleting an account deletes its data';
end $$;

\echo 'ALL ACCOUNT SECURITY TESTS PASSED'
