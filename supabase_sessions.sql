-- ============================================================
-- Terra Azur Explorer — Sessions collaboratives (Mode Collab)
-- Tables pour synchronisation temps réel via Supabase Realtime.
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

-- Une session collab = un sentier joué à plusieurs en temps réel
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,            -- ex: AZUR-K7F2
  sentier_id text not null,
  team_name text,
  host_name text,
  status text default 'active',         -- active | finished | abandoned
  created_at timestamptz default now(),
  finished_at timestamptz
);

-- Les Explorateurs qui ont rejoint une session
create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  prenom text not null,
  is_host boolean default false,
  joined_at timestamptz default now()
);

-- Les missions complétées dans une session — la table sur laquelle on écoute en temps réel
create table if not exists session_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  mission_id text not null,
  completed_by text,                    -- prénom de celui qui a validé
  completed_at timestamptz default now(),
  unique (session_id, mission_id)
);

-- RLS — lecture/écriture publique anonyme pour le MVP (pas d'auth)
alter table sessions enable row level security;
alter table session_participants enable row level security;
alter table session_progress enable row level security;

drop policy if exists "anon all sessions" on sessions;
create policy "anon all sessions" on sessions for all to anon using (true) with check (true);

drop policy if exists "anon all participants" on session_participants;
create policy "anon all participants" on session_participants for all to anon using (true) with check (true);

drop policy if exists "anon all progress" on session_progress;
create policy "anon all progress" on session_progress for all to anon using (true) with check (true);

-- Active Realtime sur la table de progression
alter publication supabase_realtime add table session_progress;
