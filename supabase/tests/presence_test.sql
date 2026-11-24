-- Tests for 0008_presence.sql.
do $$
declare v text; n int; ok boolean;
begin
  set local role anon;
  perform public.presence_set(repeat('p', 43), repeat('x', 60));
  perform public.presence_set(repeat('p', 43), repeat('y', 60)); -- overwritten, not added
  v := public.presence_get(repeat('p', 43));
  if v <> repeat('y', 60) then raise exception 'wrong note: %', v; end if;
  if public.presence_get(repeat('q', 43)) is not null then raise exception 'unknown box should be empty'; end if;
  begin perform public.presence_set('short', repeat('x', 60)); raise exception 'bad box accepted'; exception when sqlstate '22023' then null; end;
  begin perform public.presence_set(repeat('p', 43), '<script>'); raise exception 'bad note accepted'; exception when sqlstate '22023' then null; end;
  ok := false;
  begin perform 1 from public.presence; exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'anon can read the table'; end if;
  perform public.presence_clear(repeat('p', 43));
  if public.presence_get(repeat('p', 43)) is not null then raise exception 'clear failed'; end if;
  reset role;
  select count(*) into n from public.presence;
  if n <> 0 then raise exception 'table should be empty'; end if;
  raise notice 'presence_test: all good';
end $$;
