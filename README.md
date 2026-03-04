# Math Playlist (Campus MVP)

Production-ready Next.js + Supabase MVP for elementary daily math playlists.

## Stack
- Next.js App Router + TypeScript + TailwindCSS
- Supabase Auth + Postgres + RLS
- Deploy-ready for Vercel

## Features
- Teacher login with username + password
- Student login with `StudentID + PIN`
  - Student ID regex: `^[A-Z][0-9]{7}$`
  - PIN regex: `^[0-9]{6}$`
- Teacher login with school ID username + password
  - Teacher username regex: `^[A-Z][0-9]{7}$`
  - Teacher password regex: `^[0-9]{6}$`
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
2. In Supabase SQL Editor, run migrations:
   - `supabase/migrations/20260303113000_init_math_playlist.sql`
   - `supabase/migrations/20260304121500_daily_header_fields.sql`
   - `supabase/migrations/20260304133000_daily_mtools_materials.sql`
3. Configure Authentication:
   - Use Email/Password sign-in for teachers.
   - Keep Site URL set for local/dev as needed.
4. Add site URL in Supabase Auth settings:
   - Site URL: `http://localhost:3000` (dev)

## Local run
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If dev gets stuck or very slow, run:

```bash
npm run dev:clean
```

Note: running Next.js from a synced folder (like OneDrive) can make hot reload slower.

## Daily production profile (faster navigation)
For day-to-day use without dev overhead:

```bash
npm run prod
```

Then open `http://localhost:3000`.

## First-time data + teacher profile
1. Create a teacher account on `/login` with username + password.
2. The app bootstraps teacher auth + profile server-side (requires `SUPABASE_SERVICE_ROLE_KEY`).
3. Run `supabase/seed.sql` and replace `TEACHER_AUTH_USER_UUID` with your real teacher `auth.users.id`.

## Creating students (Teacher UI)
1. Go to `/teacher/classes` and create a class.
2. Open class page `/teacher/classes/[id]`.
3. Use **Create Student Account + Assign**:
   - Enter full name, Student ID (`A1234567`), PIN (`123456`).
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

## Mascot posters (student pages)
Student/teacher/public pages can show lion surroundings from these files in `public/mascots`:

- `fraction-paws.png`
- `multiply-mane.png`
- `divide-roar.png`
- `geo-cub.png`
- `measure-king.png`
- `perimeter-pouncer.png`
- `area-cub.png`
- `graph-guardian.png`
- `place-value-prince.png`
- `timely-tamer.png`

If you have the combined 10-card reference image, save it as `public/mascots/reference.png` and run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/slice-mascots.ps1
```

If you want ready-to-use placeholders right now, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-placeholder-mascots.ps1
```

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel production URL)
4. In Supabase Auth settings, update:
   - Site URL: your Vercel production URL
   - Redirect URL: `https://your-domain.vercel.app/auth/callback`
5. Redeploy.
