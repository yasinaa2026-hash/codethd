-- Codethd database setup
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  username_norm text not null unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 3 and 30)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'مشروع Codethd',
  html text not null default '',
  css text not null default '',
  js text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);
create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);
create index if not exists profiles_username_norm_idx on public.profiles(username_norm);

-- Create a profile automatically when a Codethd account is created.
create or replace function public.handle_new_codethd_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_username_norm text;
  v_display_name text;
begin
  v_username := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if v_username = '' then
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  v_username_norm := lower(trim(v_username));
  v_display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), v_username);

  insert into public.profiles (id, username, username_norm, display_name)
  values (new.id, left(trim(v_username), 30), left(v_username_norm, 30), left(trim(v_display_name), 80))
  on conflict (id) do update
  set username = excluded.username,
      username_norm = excluded.username_norm,
      display_name = excluded.display_name,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_codethd on auth.users;
create trigger on_auth_user_created_codethd
after insert on auth.users
for each row execute procedure public.handle_new_codethd_user();

-- updated_at helper
create or replace function public.touch_codethd_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.touch_codethd_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
before update on public.projects
for each row execute procedure public.touch_codethd_updated_at();

-- Enable RLS on all exposed tables.
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.follows enable row level security;

-- Profiles: signed-in users may search/view profiles, but only owners can edit.
drop policy if exists "codethd profiles select authenticated" on public.profiles;
create policy "codethd profiles select authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "codethd profiles update own" on public.profiles;
create policy "codethd profiles update own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Projects: signed-in users can view public projects; owners can create/edit/delete.
drop policy if exists "codethd projects select authenticated" on public.projects;
create policy "codethd projects select authenticated"
on public.projects for select
to authenticated
using (true);

drop policy if exists "codethd projects insert own" on public.projects;
create policy "codethd projects insert own"
on public.projects for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "codethd projects update own" on public.projects;
create policy "codethd projects update own"
on public.projects for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "codethd projects delete own" on public.projects;
create policy "codethd projects delete own"
on public.projects for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Follows: users can see their own follow list and create/remove their own follows.
drop policy if exists "codethd follows select own" on public.follows;
create policy "codethd follows select own"
on public.follows for select
to authenticated
using ((select auth.uid()) = follower_id or (select auth.uid()) = following_id);

drop policy if exists "codethd follows insert own" on public.follows;
create policy "codethd follows insert own"
on public.follows for insert
to authenticated
with check ((select auth.uid()) = follower_id and follower_id <> following_id);

drop policy if exists "codethd follows delete own" on public.follows;
create policy "codethd follows delete own"
on public.follows for delete
to authenticated
using ((select auth.uid()) = follower_id);

-- Grant only what the browser needs. RLS remains the final gate.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, delete on public.follows to authenticated;


-- ملاحظة: Supabase Anonymous Users تستخدم role = authenticated.
-- لذلك سيعمل معها RLS أعلاه. فعّل Allow anonymous sign-ins من Authentication.
