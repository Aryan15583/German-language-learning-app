-- Zwei Herzen ♡: photos, videos and voice messages (run after 0006; safe to run more than once).
--
-- Every file is encrypted on the phone before upload (a fresh key per file, sent inside the
-- end-to-end encrypted chat message). This bucket only ever holds scrambled bytes.
-- Only signed-in accounts can upload or download. Like Signal, the receiving phone keeps the
-- file and deletes the server copy right away; anything left over is deleted after 30 days.

-- A private bucket: max 50 MB per file, encrypted bytes only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 52428800, array['application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = 52428800, allowed_mime_types = array['application/octet-stream'];

drop policy if exists "zh media: upload" on storage.objects;
drop policy if exists "zh media: download" on storage.objects;
drop policy if exists "zh media: delete own" on storage.objects;
drop policy if exists "zh media: delete" on storage.objects;

-- Upload: signed in, a random 32-character name, at most 200 files a day per account.
create policy "zh media: upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and name ~ '^[A-Za-z0-9_-]{32}$'
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'media' and o.owner_id = (select auth.uid())::text and o.created_at > now() - interval '1 day'
    ) < 200
  );

-- Download: signed in (names are random and the bytes are encrypted).
create policy "zh media: download" on storage.objects
  for select to authenticated
  using (bucket_id = 'media');

-- Delete: signed in. The receiving phone removes the server copy once it has saved the file
-- (names are random 32-character secrets that only the two of you ever see).
create policy "zh media: delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media');

-- Once a day, the notify function deletes files older than 30 days.
do $$
begin
  perform cron.unschedule('zh-media-cleanup') where exists (select 1 from cron.job where jobname = 'zh-media-cleanup');
  perform cron.schedule(
    'zh-media-cleanup',
    '17 3 * * *',
    $job$ select net.http_post(url := (select function_url from public.push_config where id = 1), body := '{"type":"cleanup"}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb) $job$
  );
end $$;

notify pgrst, 'reload schema';
