-- Add daily header fields for teacher/student planning UI
alter table if exists public.daily_playlists
  add column if not exists instructions text,
  add column if not exists student_objective text,
  add column if not exists teks text;

-- Backfill from legacy notes column when present
update public.daily_playlists
set instructions = notes
where instructions is null
  and notes is not null;
