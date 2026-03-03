# Math Playlist (Campus MVP)

Production-ready Next.js + Supabase MVP for elementary daily math playlists.

## Stack
- Next.js App Router + TypeScript + TailwindCSS
- Supabase Auth + Postgres + RLS
- Deploy-ready for Vercel

## Features
- Teacher login with Google OAuth
- Student login with `StudentID + PIN`
  - Student ID regex: `^[A-Z][0-9]{6}$`
  - PIN regex: `^[0-9]{6}$`
  - Email mapping: `${ID}@students.example.com`
- Role-based route protection in middleware (`/teacher/*`, `/student/*`)
- Teacher class/roster management + student account creation
- Daily playlist builder (by date), publish toggle, item reorder
- Student completion flow with progress tracking
- Tracker grid for teachers + grading + CSV export
- Optional gamification included (XP + coins + class leaderboard)

## Required environment variables
Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Supabase setup
1. Create a new Supabase project.
2. In Supabase SQL Editor, run migration:
   - `supabase/migrations/20260303113000_init_math_playlist.sql`
3. Configure Authentication:
   - Enable `Google` provider in Auth > Providers.
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://YOUR-VERCEL-DOMAIN/auth/callback`
4. Add site URL / redirect in Supabase Auth settings:
   - Site URL: `http://localhost:3000` (dev)
   - Additional redirect: your Vercel domain callback above.

## Local run
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## First-time data + teacher profile
1. Log in once via Google on `/login` as the teacher.
2. The app will auto-create a `profiles` record with `role='teacher'` if missing.
3. Run `supabase/seed.sql` and replace `TEACHER_AUTH_USER_UUID` with your real teacher `auth.users.id`.

## Creating students (Teacher UI)
1. Go to `/teacher/classes` and create a class.
2. Open class page `/teacher/classes/[id]`.
3. Use **Create Student Account + Assign**:
   - Enter full name, Student ID (`A123456`), PIN (`123456`).
4. Students log in at `/login` using ID + PIN.

## Project structure
- `app/(public)/*`
- `app/student/*`
- `app/teacher/*`
- `lib/supabase/*`
- `supabase/migrations/*.sql`

## Notes
- Server routes/actions enforce permission checks in addition to RLS.
- XP/coin awarding happens server-side only.
- CSV export route: `/api/teacher/export/:dailyId`
