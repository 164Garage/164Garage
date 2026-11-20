-- 1:64 Garage database setup
-- Paste all of this into Supabase -> SQL Editor -> New query, then click Run.
-- Safe to run again: it only creates what's missing and replaces the rules.

-- Every piece of site data is one JSON document, addressed like the Claude-hosted site:
--   col = "profiles", id = <user id>                -> a collector's public profile
--   col = "data/users/<user id>", id = <car id>     -> a private garage car
--   col = "listings/<user id>/photos", id = <id>    -> a listing photo
create table if not exists public.docs (
  col        text        not null,
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  owner      uuid        default auth.uid(),
  version    integer     not null default 1,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
create index if not exists docs_col_idx on public.docs (col);
alter table public.docs replica identity full;   -- realtime sends the old row on delete

-- Site admins (Aidan). Add yourself after your first log-in, see the bottom of this file.
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select using (user_id = auth.uid());

-- Scanner usage log, used to cap scans per collector per day.
create table if not exists public.scans (
  id         bigserial   primary key,
  user_id    uuid        not null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists scans_user_day on public.scans (user_id, created_at);
alter table public.scans enable row level security;
drop policy if exists scans_own_read on public.scans;
drop policy if exists scans_own_add on public.scans;
create policy scans_own_read on public.scans for select using (user_id = auth.uid());
create policy scans_own_add  on public.scans for insert with check (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- Who may read a document
create or replace function public.can_read(c text, i text) returns boolean
language sql stable as $$
  select case
    when split_part(c, '/', 1) = 'data'  then split_part(c, '/', 3) = auth.uid()::text      -- private garages: owner only
    when split_part(c, '/', 1) in ('activity', 'subscribers', 'reports')
                                         then public.is_admin() or (c not like '%/%' and i = auth.uid()::text)
    when split_part(c, '/', 1) in ('releases','releasePhotos','values','catalog','posts','listings',
                                   'profiles','ratings','offers') then true
    else public.is_admin()
  end
$$;

-- Who may create, change or delete a document
create or replace function public.can_write(c text, i text) returns boolean
language sql stable as $$
  select auth.uid() is not null and case
    when split_part(c, '/', 1) = 'data'  then split_part(c, '/', 3) = auth.uid()::text       -- only your own garage
    when public.is_admin()               then true                                            -- admins manage everything else
    when split_part(c, '/', 1) in ('releases','releasePhotos','values') then false            -- drops and prices: admins only
    when split_part(c, '/', 1) in ('catalog','posts','listings','profiles','ratings','offers',
                                   'activity','subscribers','reports')
      then case when c like '%/%' then split_part(c, '/', 2) = auth.uid()::text               -- e.g. listings/<you>/photos
                else i = auth.uid()::text end                                                 -- e.g. profiles/<you>
    else false
  end
$$;

alter table public.docs enable row level security;
drop policy if exists docs_read   on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_read   on public.docs for select using (public.can_read(col, id));
create policy docs_insert on public.docs for insert with check (public.can_write(col, id));
create policy docs_update on public.docs for update using (public.can_write(col, id)) with check (public.can_write(col, id));
create policy docs_delete on public.docs for delete using (public.can_write(col, id));

-- Version number and timestamp go up on every change
create or replace function public.docs_touch() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then new.version := old.version + 1; new.owner := old.owner; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs for each row execute function public.docs_touch();

-- Keep a single document under 2 MB (photos are stored shrunk inside documents)
alter table public.docs drop constraint if exists docs_size;
alter table public.docs add constraint docs_size check (pg_column_size(data) < 2000000);

-- Live updates (the site refreshes when something changes)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on public.docs to anon, authenticated;
grant select, insert on public.scans to authenticated;
grant usage, select on sequence public.scans_id_seq to authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------------------
-- AFTER you've logged in to the site once, make yourself the admin.
-- Replace the email below with the one you logged in with, then run just this line:
--
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
-- ---------------------------------------------------------------------------
