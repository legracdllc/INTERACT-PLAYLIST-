-- Math Playlist seed data
-- Run after migration. This seed assumes your teacher auth user already exists.
-- Replace the UUID placeholders below with real IDs from your Supabase project.

-- 1) Create one school
insert into public.schools (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Sample Elementary')
on conflict (id) do update set name = excluded.name;

-- 2) Link teacher profile to school
-- Replace TEACHER_AUTH_USER_UUID with your real auth.users.id from Google sign-in.
insert into public.profiles (id, email, full_name, role, school_id)
values ('TEACHER_AUTH_USER_UUID', 'teacher@example.com', 'Sample Teacher', 'teacher', '11111111-1111-1111-1111-111111111111')
on conflict (id) do update set
  school_id = excluded.school_id,
  role = 'teacher';

-- 3) Create one class
insert into public.classes (id, school_id, teacher_id, name)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'TEACHER_AUTH_USER_UUID',
  '4th Grade Math - Demo'
)
on conflict (id) do update set
  name = excluded.name;

-- 4) Create one daily playlist (date can be adjusted)
insert into public.daily_playlists (id, class_id, date, title, notes, created_by, published)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  current_date,
  'Math Playlist Demo Day',
  'Use placeholder links/resources for testing.',
  'TEACHER_AUTH_USER_UUID',
  true
)
on conflict (id) do update set
  title = excluded.title,
  notes = excluded.notes,
  published = excluded.published;

-- 5) Add 6 sample items
insert into public.daily_playlist_items (daily_playlist_id, order_index, teks, skill_name, type, url, xp, max_score)
values
  ('33333333-3333-3333-3333-333333333333', 0, '4.4A', 'Fraction Warmup', 'mini', 'https://example.com/warmup', 10, 10),
  ('33333333-3333-3333-3333-333333333333', 1, '4.4A', 'Guided Fractions', 'guided', 'https://example.com/guided', 15, 20),
  ('33333333-3333-3333-3333-333333333333', 2, '4.5B', 'Independent Practice', 'independent', 'https://example.com/practice', 15, 20),
  ('33333333-3333-3333-3333-333333333333', 3, '4.6C', 'STAAR Spiral', 'staar', 'https://example.com/staar', 20, 25),
  ('33333333-3333-3333-3333-333333333333', 4, '4.7D', 'Challenge Task', 'challenge', 'https://example.com/challenge', 25, 30),
  ('33333333-3333-3333-3333-333333333333', 5, '4.4A', 'Exit Ticket', 'exit', 'https://example.com/exit', 10, 10)
on conflict do nothing;
