-- Zwei Herzen ♡ — log in without waiting for a confirmation email.
--
-- Supabase's built-in email sender only delivers to members of your own Supabase
-- team, so confirmation emails to anyone else (like your partner) never arrive,
-- and those accounts get stuck at "Email not confirmed".
--
-- This file:
--   1. confirms every account that is stuck right now, and
--   2. confirms new accounts automatically when they're created.
--
-- It changes nothing else. Safe to run more than once.
-- Tip: after you've both signed up, turn off "Allow new users to sign up"
-- (Authentication → Sign In / Providers) so nobody else can make an account.

-- 1. Unstick existing accounts.
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

-- 2. Confirm new accounts as they're created.
create or replace function public.zh_auto_confirm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

-- Only the database itself may run it (it's a trigger, not an API function).
revoke all on function public.zh_auto_confirm() from public;
revoke all on function public.zh_auto_confirm() from anon, authenticated;

drop trigger if exists zh_auto_confirm on auth.users;
create trigger zh_auto_confirm
  before insert on auth.users
  for each row execute function public.zh_auto_confirm();
