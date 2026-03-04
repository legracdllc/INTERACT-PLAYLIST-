-- Math Playlist Campus MVP schema + RLS
-- This migration creates all required tables and row-level security policies.

create extension if not exists pgcrypto;

-- ---------- Core tables ----------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null check (role in ('student', 'teacher')),
  school_id uuid references public.schools(id),
  avatar_json jsonb not null default '{}'::jsonb,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id),
  teacher_id uuid not null references public.profiles(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.class_students (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  primary key (class_id, student_id)
);

-- ---------- Daily playlists ----------
create table if not exists public.daily_playlists (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  date date not null,
  title text,
  instructions text,
  student_objective text,
  teks text,
  m_tools text[] not null default '{}'::text[],
  materials text[] not null default '{}'::text[],
  created_by uuid references public.profiles(id),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (class_id, date)
);

create table if not exists public.daily_playlist_items (
  id uuid primary key default gen_random_uuid(),
  daily_playlist_id uuid not null references public.daily_playlists(id) on delete cascade,
  order_index int not null,
  teks text,
  skill_name text,
  type text,
  url text,
  xp int not null default 10,
  max_score numeric null
);

-- ---------- Tracking ----------
create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  daily_playlist_id uuid not null references public.daily_playlists(id) on delete cascade,
  daily_playlist_item_id uuid not null references public.daily_playlist_items(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'not_started',
  completed boolean not null default false,
  score numeric null,
  evidence_url text null,
  teacher_note text null,
  started_at timestamptz null,
  submitted_at timestamptz null,
  graded_at timestamptz null,
  updated_at timestamptz not null default now(),
  unique (daily_playlist_item_id, student_id)
);

-- ---------- Gamification ----------
create table if not exists public.wallets (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  coins int not null default 0
);

create table if not exists public.progress_xp (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  xp int not null default 0
);

-- ---------- Helper functions for RLS ----------
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_teacher_of_class(class_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.classes c
    where c.id = class_uuid and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_student_in_class(class_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.class_students cs
    where cs.class_id = class_uuid and cs.student_id = auth.uid()
  );
$$;

create or replace function public.progress_is_in_teacher_class(progress_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.daily_progress dp
    join public.daily_playlists d on d.id = dp.daily_playlist_id
    join public.classes c on c.id = d.class_id
    where dp.id = progress_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.progress_is_own_and_accessible(progress_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.daily_progress dp
    join public.daily_playlists d on d.id = dp.daily_playlist_id
    join public.class_students cs on cs.class_id = d.class_id
    where dp.id = progress_id
      and dp.student_id = auth.uid()
      and d.published = true
      and cs.student_id = auth.uid()
  );
$$;

-- Keep updated_at fresh.
create or replace function public.touch_daily_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_progress_touch on public.daily_progress;
create trigger trg_daily_progress_touch
before update on public.daily_progress
for each row execute function public.touch_daily_progress_updated_at();

-- ---------- RLS enable ----------
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.daily_playlists enable row level security;
alter table public.daily_playlist_items enable row level security;
alter table public.daily_progress enable row level security;
alter table public.wallets enable row level security;
alter table public.progress_xp enable row level security;

-- ---------- RLS policies ----------
-- Schools: users can read their own school record.
drop policy if exists "schools_select_own" on public.schools;
create policy "schools_select_own"
on public.schools for select
using (id = (select school_id from public.profiles where id = auth.uid()));

-- Profiles: user can read/update own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
with check (id = auth.uid());

-- Teachers can read student profiles in classes they own.
drop policy if exists "profiles_teacher_read_students" on public.profiles;
create policy "profiles_teacher_read_students"
on public.profiles for select
using (
  exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = public.profiles.id
      and c.teacher_id = auth.uid()
  )
);

-- Classes: teacher full CRUD on owned classes; students can read enrolled class.
drop policy if exists "classes_teacher_crud" on public.classes;
create policy "classes_teacher_crud"
on public.classes for all
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "classes_student_read_enrolled" on public.classes;
create policy "classes_student_read_enrolled"
on public.classes for select
using (public.is_student_in_class(id));

-- class_students: teachers manage rosters for owned classes; students read own membership only.
drop policy if exists "class_students_teacher_manage" on public.class_students;
create policy "class_students_teacher_manage"
on public.class_students for all
using (public.is_teacher_of_class(class_id))
with check (public.is_teacher_of_class(class_id));

drop policy if exists "class_students_student_read_own" on public.class_students;
create policy "class_students_student_read_own"
on public.class_students for select
using (student_id = auth.uid());

-- daily_playlists:
-- teachers CRUD for own classes.
drop policy if exists "daily_playlists_teacher_crud" on public.daily_playlists;
create policy "daily_playlists_teacher_crud"
on public.daily_playlists for all
using (public.is_teacher_of_class(class_id))
with check (public.is_teacher_of_class(class_id));

-- students can only read published playlists for classes they are assigned to.
drop policy if exists "daily_playlists_student_read_published" on public.daily_playlists;
create policy "daily_playlists_student_read_published"
on public.daily_playlists for select
using (published = true and public.is_student_in_class(class_id));

-- daily_playlist_items:
-- teachers CRUD items if they own the parent class.
drop policy if exists "daily_items_teacher_crud" on public.daily_playlist_items;
create policy "daily_items_teacher_crud"
on public.daily_playlist_items for all
using (
  exists (
    select 1
    from public.daily_playlists d
    where d.id = daily_playlist_id and public.is_teacher_of_class(d.class_id)
  )
)
with check (
  exists (
    select 1
    from public.daily_playlists d
    where d.id = daily_playlist_id and public.is_teacher_of_class(d.class_id)
  )
);

-- students can read items only when parent playlist is published + class access.
drop policy if exists "daily_items_student_read_published" on public.daily_playlist_items;
create policy "daily_items_student_read_published"
on public.daily_playlist_items for select
using (
  exists (
    select 1
    from public.daily_playlists d
    where d.id = daily_playlist_id
      and d.published = true
      and public.is_student_in_class(d.class_id)
  )
);

-- daily_progress:
-- students can read only their own rows.
drop policy if exists "daily_progress_student_read_own" on public.daily_progress;
create policy "daily_progress_student_read_own"
on public.daily_progress for select
using (student_id = auth.uid());

-- students can insert only their own rows and only for published playlists they can access.
drop policy if exists "daily_progress_student_insert_own" on public.daily_progress;
create policy "daily_progress_student_insert_own"
on public.daily_progress for insert
with check (
  student_id = auth.uid()
  and exists (
    select 1
    from public.daily_playlists d
    join public.class_students cs on cs.class_id = d.class_id
    where d.id = daily_playlist_id
      and d.published = true
      and cs.student_id = auth.uid()
  )
);

-- students can update only their own accessible rows.
drop policy if exists "daily_progress_student_update_own" on public.daily_progress;
create policy "daily_progress_student_update_own"
on public.daily_progress for update
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- teachers can read/update progress for students in their classes.
drop policy if exists "daily_progress_teacher_read_class" on public.daily_progress;
create policy "daily_progress_teacher_read_class"
on public.daily_progress for select
using (
  exists (
    select 1
    from public.daily_playlists d
    join public.classes c on c.id = d.class_id
    where d.id = daily_playlist_id and c.teacher_id = auth.uid()
  )
);

drop policy if exists "daily_progress_teacher_update_class" on public.daily_progress;
create policy "daily_progress_teacher_update_class"
on public.daily_progress for update
using (
  exists (
    select 1
    from public.daily_playlists d
    join public.classes c on c.id = d.class_id
    where d.id = daily_playlist_id and c.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_playlists d
    join public.classes c on c.id = d.class_id
    where d.id = daily_playlist_id and c.teacher_id = auth.uid()
  )
);

-- wallets/progress_xp: readable by owner student and teachers of that student's classes.
-- No anon updates; award writes should happen through trusted server/service role.
drop policy if exists "wallets_student_teacher_read" on public.wallets;
create policy "wallets_student_teacher_read"
on public.wallets for select
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = wallets.student_id and c.teacher_id = auth.uid()
  )
);

drop policy if exists "progress_xp_student_teacher_read" on public.progress_xp;
create policy "progress_xp_student_teacher_read"
on public.progress_xp for select
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = progress_xp.student_id and c.teacher_id = auth.uid()
  )
);
