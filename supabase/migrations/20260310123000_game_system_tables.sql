-- Game system support:
-- 1. Auto-create profile rows from auth.users metadata
-- 2. Persist student inventory / equipped cosmetics
-- 3. Persist optional Top 3 snapshots per playlist

create or replace function public.handle_auth_user_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inferred_role text;
  inferred_name text;
begin
  inferred_role := coalesce(new.raw_user_meta_data ->> 'role', new.raw_app_meta_data ->> 'role');
  inferred_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1));

  if inferred_role in ('student', 'teacher') then
    insert into public.profiles (
      id,
      email,
      full_name,
      role,
      avatar_json,
      settings_json
    )
    values (
      new.id,
      new.email,
      nullif(inferred_name, ''),
      inferred_role,
      '{}'::jsonb,
      '{}'::jsonb
    )
    on conflict (id) do update
      set email = excluded.email,
          full_name = coalesce(excluded.full_name, public.profiles.full_name),
          role = excluded.role;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_profile_sync on auth.users;
create trigger trg_auth_user_profile_sync
after insert or update on auth.users
for each row execute function public.handle_auth_user_profile_sync();

create table if not exists public.student_inventory (
  student_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null,
  item_type text not null check (item_type in ('helmet', 'cape', 'trail', 'hair', 'outfit', 'shoes', 'weapon', 'companion')),
  cost_coins int not null default 0 check (cost_coins >= 0),
  source text not null default 'store',
  is_equipped boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  primary key (student_id, item_key)
);

create index if not exists idx_student_inventory_student_equipped
  on public.student_inventory (student_id, is_equipped);

create table if not exists public.daily_playlist_winners (
  daily_playlist_id uuid not null references public.daily_playlists(id) on delete cascade,
  rank smallint not null check (rank between 1 and 3),
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed_items int not null default 0 check (completed_items >= 0),
  evidence_count int not null default 0 check (evidence_count >= 0),
  total_score numeric not null default 0,
  finish_time timestamptz null,
  award_reason text null,
  created_at timestamptz not null default now(),
  primary key (daily_playlist_id, rank),
  unique (daily_playlist_id, student_id)
);

create index if not exists idx_daily_playlist_winners_student
  on public.daily_playlist_winners (student_id, created_at desc);

alter table public.student_inventory enable row level security;
alter table public.daily_playlist_winners enable row level security;

drop policy if exists "student_inventory_read_own_or_teacher" on public.student_inventory;
create policy "student_inventory_read_own_or_teacher"
on public.student_inventory for select
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = public.student_inventory.student_id
      and c.teacher_id = auth.uid()
  )
);

drop policy if exists "student_inventory_write_own" on public.student_inventory;
create policy "student_inventory_write_own"
on public.student_inventory for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "daily_playlist_winners_read_teacher_or_student" on public.daily_playlist_winners;
create policy "daily_playlist_winners_read_teacher_or_student"
on public.daily_playlist_winners for select
using (
  exists (
    select 1
    from public.daily_playlists d
    join public.classes c on c.id = d.class_id
    where d.id = public.daily_playlist_winners.daily_playlist_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1
    from public.daily_playlists d
    join public.class_students cs on cs.class_id = d.class_id
    where d.id = public.daily_playlist_winners.daily_playlist_id
      and cs.student_id = auth.uid()
  )
);
