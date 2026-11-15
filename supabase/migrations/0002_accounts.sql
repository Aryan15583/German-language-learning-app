-- Zwei Herzen ♡ Until Berlin: accounts with a zero-knowledge cloud backup.
--
-- Each account stores ONE row: its progress, encrypted on the phone with a key
-- derived from the user's password (PBKDF2-SHA256 + XChaCha20-Poly1305).
-- The database never sees the password, the key or any readable progress.
-- Row level security: a signed-in user can only ever touch their own row.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Salt for deriving the encryption key from the password (not secret).
  salt text not null,
  -- The encrypted progress (base64url).
  blob text not null,
  updated_at timestamptz not null default now(),
  constraint user_data_salt_format check (salt ~ '^[A-Za-z0-9_-]{16,64}$'),
  constraint user_data_blob_format check (blob ~ '^[A-Za-z0-9_-]+$' and char_length(blob) between 40 and 3000000)
);

alter table public.user_data enable row level security;

revoke all on table public.user_data from public, anon, authenticated;
grant select, insert, update, delete on table public.user_data to authenticated;

drop policy if exists "own row: read" on public.user_data;
drop policy if exists "own row: insert" on public.user_data;
drop policy if exists "own row: update" on public.user_data;
drop policy if exists "own row: delete" on public.user_data;

create policy "own row: read" on public.user_data
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own row: insert" on public.user_data
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own row: update" on public.user_data
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own row: delete" on public.user_data
  for delete to authenticated using (user_id = (select auth.uid()));

-- Keep updated_at honest.
create or replace function public.user_data_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before insert or update on public.user_data
  for each row execute function public.user_data_touch();
