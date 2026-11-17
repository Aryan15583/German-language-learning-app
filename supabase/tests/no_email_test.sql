-- Tests for 0003_no_email_needed.sql (run after setup_roles.sql and the migrations).
do $$
declare n int;
begin
  -- A brand-new account is confirmed automatically.
  insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'new@test.dev');
  select count(*) into n from auth.users where email = 'new@test.dev' and email_confirmed_at is not null;
  if n <> 1 then raise exception 'new account was not auto-confirmed'; end if;

  -- An already-confirmed date is kept as it is.
  insert into auth.users (id, email, email_confirmed_at) values ('00000000-0000-0000-0000-0000000000e2', 'old@test.dev', '2020-01-01');
  select count(*) into n from auth.users where email = 'old@test.dev' and email_confirmed_at = '2020-01-01';
  if n <> 1 then raise exception 'existing confirmation date was changed'; end if;

  -- Nobody can call the trigger function through the API.
  if has_function_privilege('anon', 'public.zh_auto_confirm()', 'execute') or has_function_privilege('authenticated', 'public.zh_auto_confirm()', 'execute') then
    raise exception 'API roles can call zh_auto_confirm';
  end if;
  raise notice 'no_email_test: all good';
end $$;

-- Stuck accounts (created before the fix) get confirmed when the migration runs again.
alter table auth.users disable trigger zh_auto_confirm;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e3', 'stuck@test.dev');
alter table auth.users enable trigger zh_auto_confirm;
\ir ../migrations/0003_no_email_needed.sql
do $$ begin
  if exists (select 1 from auth.users where email = 'stuck@test.dev' and email_confirmed_at is null) then
    raise exception 'stuck account was not confirmed';
  end if;
  raise notice 'no_email_test: stuck accounts fixed';
end $$;
