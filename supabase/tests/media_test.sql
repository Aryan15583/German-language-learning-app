-- Tests for 0007_media.sql policies. Locally, storage.* is a small stand-in for Supabase Storage.
do $$
declare
  me uuid := '00000000-0000-0000-0000-00000000aa01';
  other uuid := '00000000-0000-0000-0000-00000000aa02';
  ok boolean;
  n int;
begin
  -- Anyone not signed in can't upload or download.
  set local role anon;
  ok := false;
  begin insert into storage.objects (bucket_id, name, owner_id) values ('media', repeat('a', 32), null); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'anon could upload'; end if;
  reset role;

  -- Signed in: a random 32-character name is fine; anything else is refused.
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into storage.objects (bucket_id, name, owner_id) values ('media', repeat('b', 32), me::text);
  ok := false;
  begin insert into storage.objects (bucket_id, name, owner_id) values ('media', '../evil.html', me::text); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'odd file name accepted'; end if;
  ok := false;
  begin insert into storage.objects (bucket_id, name, owner_id) values ('other-bucket', repeat('c', 32), me::text); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'upload to another bucket accepted'; end if;
  select count(*) into n from storage.objects where bucket_id = 'media';
  if n < 1 then raise exception 'signed-in user cannot download'; end if;
  reset role;

  -- 200 files a day per account.
  insert into storage.objects (bucket_id, name, owner_id) select 'media', lpad(g::text, 32, 'x'), me::text from generate_series(1, 199) g;
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin insert into storage.objects (bucket_id, name, owner_id) values ('media', repeat('d', 32), me::text); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'daily limit not enforced'; end if;
  reset role;

  -- Not signed in: can't delete.
  set local role anon;
  ok := false;
  begin delete from storage.objects where name = repeat('b', 32); exception when insufficient_privilege then ok := true; end;
  reset role;
  if not exists (select 1 from storage.objects where name = repeat('b', 32)) then raise exception 'anon deleted a file'; end if;
  -- My partner (the receiver) can delete the server copy once it's saved on their phone.
  perform set_config('request.jwt.claims', json_build_object('sub', other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from storage.objects where name = repeat('b', 32);
  reset role;
  if exists (select 1 from storage.objects where name = repeat('b', 32)) then raise exception 'receiver could not delete'; end if;

  if not exists (select 1 from storage.buckets where id = 'media' and public = false and file_size_limit = 52428800) then raise exception 'bucket settings wrong'; end if;
  if not exists (select 1 from cron.job where jobname = 'zh-media-cleanup') then raise exception 'cleanup job missing'; end if;
  raise notice 'media_test: all good';
end $$;
