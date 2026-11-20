-- Username/email + password log-in (applied Nov 19, 2026). Safe to run again.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.login_attempts (who text not null, at timestamptz not null default now());
create index if not exists login_attempts_who on public.login_attempts (who, at);
alter table public.login_attempts enable row level security;

-- Returns the account's email only when the password is right, so emails stay private.
-- 8 wrong tries in 15 minutes locks that username/email for 15 minutes.
create or replace function public.login_email(who text, pass text) returns text
language plpgsql security definer set search_path = public, extensions, auth as $$
declare em text; pw text; w text := ltrim(lower(trim(coalesce(who, ''))), '@');
begin
  if w = '' or coalesce(pass, '') = '' then return null; end if;
  delete from public.login_attempts where at < now() - interval '1 day';
  if (select count(*) from public.login_attempts a where a.who = w and a.at > now() - interval '15 minutes') >= 8 then
    raise exception 'too_many_attempts';
  end if;
  if position('@' in w) > 0 then
    select u.email, u.encrypted_password into em, pw from auth.users u where lower(u.email) = w limit 1;
  else
    select u.email, u.encrypted_password into em, pw
      from public.docs d join auth.users u on u.id::text = d.id
      where d.col = 'profiles' and lower(d.data->>'username') = w limit 1;
  end if;
  if em is null or coalesce(pw, '') = '' or extensions.crypt(pass, pw) <> pw then
    insert into public.login_attempts (who) values (w);
    return null;
  end if;
  delete from public.login_attempts a where a.who = w;
  return em;
end $$;
revoke all on function public.login_email(text, text) from public;
grant execute on function public.login_email(text, text) to anon, authenticated;

create or replace function public.username_free(u text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.docs where col = 'profiles' and lower(data->>'username') = lower(ltrim(trim(u), '@')))
$$;
grant execute on function public.username_free(text) to anon, authenticated;

create unique index if not exists profiles_username_unique on public.docs (lower(data->>'username'))
  where col = 'profiles' and coalesce(data->>'username', '') <> '';
