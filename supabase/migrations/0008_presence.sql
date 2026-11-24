-- Zwei Herzen ♡: "online" / "last seen" (run after 0007; safe to run more than once).
--
-- Each phone keeps one tiny, end-to-end encrypted note — "I was here at 14:05, online / away" —
-- in a box whose name only the two of you can work out. It's overwritten, never piled up,
-- so it doesn't grow. The server can't read it.

create table if not exists public.presence (
  box text primary key,
  payload text not null,
  updated_at timestamptz not null default now(),
  constraint presence_box_format check (box ~ '^[A-Za-z0-9_-]{43}$'),
  constraint presence_payload_format check (payload ~ '^[A-Za-z0-9_-]+$' and char_length(payload) between 40 and 1000)
);
alter table public.presence enable row level security;
revoke all on table public.presence from public, anon, authenticated;

create or replace function public.presence_set(p_box text, p_payload text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_box is null or p_box !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid box' using errcode = '22023';
  end if;
  if p_payload is null or p_payload !~ '^[A-Za-z0-9_-]+$' or char_length(p_payload) not between 40 and 1000 then
    raise exception 'invalid payload' using errcode = '22023';
  end if;
  if not exists (select 1 from public.presence where box = p_box) and (select count(*) from public.presence) >= 200 then
    raise exception 'too many' using errcode = '54000';
  end if;
  insert into public.presence (box, payload, updated_at) values (p_box, p_payload, now())
  on conflict (box) do update set payload = excluded.payload, updated_at = now();
end;
$$;

create or replace function public.presence_get(p_box text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_box is null or p_box !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'invalid box' using errcode = '22023';
  end if;
  return (select payload from public.presence where box = p_box);
end;
$$;

-- Turning "last seen" off removes my note.
create or replace function public.presence_clear(p_box text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.presence where box = p_box;
$$;

revoke all on function public.presence_set(text, text) from public;
revoke all on function public.presence_get(text) from public;
revoke all on function public.presence_clear(text) from public;
grant execute on function public.presence_set(text, text) to anon, authenticated;
grant execute on function public.presence_get(text) to anon, authenticated;
grant execute on function public.presence_clear(text) to anon, authenticated;

notify pgrst, 'reload schema';
