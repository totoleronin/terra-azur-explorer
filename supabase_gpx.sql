-- ============================================================
-- Terra Azur Explorer — Tracé GPX avec élévation
-- Ajoute la colonne gpx_track à la table sentiers.
-- Format : [[lat, lng, elevation_m], ...]
-- Les fichiers GPX réels seront chargés par l'utilisateur.
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

alter table sentiers
  add column if not exists gpx_track jsonb;

-- Note : gpx_track sera rempli manuellement depuis les vrais fichiers GPX.
-- Exemple de format attendu :
-- [[43.762, 7.195, 312], [43.763, 7.196, 320], ...]
--
-- En attendant, le frontend utilise route_coords comme fallback
-- avec un profil altimétrique synthétique.
