-- Add M-Tools and Materials fields to daily playlist header.
-- Both columns support multiple selections from the teacher UI.

alter table public.daily_playlists
  add column if not exists m_tools text[] not null default '{}'::text[],
  add column if not exists materials text[] not null default '{}'::text[];
