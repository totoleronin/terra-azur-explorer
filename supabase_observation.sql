-- ============================================================
-- Terra Azur Explorer — Mécanique d'observation (Priorité 4)
-- Ajoute 5 colonnes à la table missions :
--   rayon_approche_metres  : zone de teaser (~150m)
--   observation_type       : 'visuel' | 'sensoriel' | 'comportemental' | 'orientation'
--   observation_question   : question d'observation à poser sur le terrain
--   observation_choix      : tableau JSON de 3 propositions
--   observation_bonne_reponse : index (0-2) de la bonne réponse
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

alter table missions
  add column if not exists rayon_approche_metres int default 150,
  add column if not exists observation_type text,
  add column if not exists observation_question text,
  add column if not exists observation_choix jsonb,
  add column if not exists observation_bonne_reponse int;

-- ── Baous Saint-Jeannet ─────────────────────────────────────

update missions set
  rayon_approche_metres = 120,
  observation_type = 'visuel',
  observation_question = 'Regarde la paroi du Baou devant toi. Quelle est la couleur dominante de la roche ?',
  observation_choix = '["Grise et bleue, comme du granit", "Rouge et ocre, comme de la terre cuite", "Noire et brillante, comme de l''ardoise"]',
  observation_bonne_reponse = 1
where id = 'escalade-baou';

update missions set
  rayon_approche_metres = 100,
  observation_type = 'comportemental',
  observation_question = 'Lève les yeux et scrute le ciel. Comment se déplacent les grands oiseaux que tu peux observer ?',
  observation_choix = '["Ils battent rapidement des ailes en ligne droite", "Ils planent sans battre des ailes, en larges cercles", "Ils descendent en piqué comme des flèches"]',
  observation_bonne_reponse = 1
where id = 'vautour-fauve';

update missions set
  rayon_approche_metres = 80,
  observation_type = 'sensoriel',
  observation_question = 'Touche doucement les feuilles de l''arbre près de toi. Quelle sensation ressens-tu ?',
  observation_choix = '["Lisses et brillantes, comme du cuir verni", "Douces et veloutées, comme du tissu doux", "Sèches et craquantes, comme du papier froissé"]',
  observation_bonne_reponse = 1
where id = 'chene-pubescent';

update missions set
  rayon_approche_metres = 150,
  observation_type = 'orientation',
  observation_question = 'Tu es devant la chapelle. Vers quel horizon regarde-t-elle ?',
  observation_choix = '["Vers la mer et le sud", "Vers le village et la vallée", "Vers les falaises et le sommet"]',
  observation_bonne_reponse = 0
where id = 'chapelle-notre-dame';

-- ── Mont Vinaigre ───────────────────────────────────────────

update missions set
  rayon_approche_metres = 100,
  observation_type = 'visuel',
  observation_question = 'Regarde le tronc du grand arbre devant toi. Comment est son écorce ?',
  observation_choix = '["Lisse et argentée, comme un bouleau", "Épaisse et creusée en liège brun-orangé", "Fine et rouge qui se décolle en lamelles"]',
  observation_bonne_reponse = 1
where id = 'chene-liege';

update missions set
  rayon_approche_metres = 120,
  observation_type = 'comportemental',
  observation_question = 'Observe attentivement les rochers autour de toi. Où un bouquetin placerait-il ses sabots en premier ?',
  observation_choix = '["Sur les parties plates et herbeuses", "Sur les saillies les plus étroites de la roche", "Dans les creux humides et ombragés"]',
  observation_bonne_reponse = 1
where id = 'bouquetin';

update missions set
  rayon_approche_metres = 100,
  observation_type = 'visuel',
  observation_question = 'Regarde le sol et les rochers autour de toi. Quelle est la couleur dominante de la terre et des pierres ?',
  observation_choix = '["Beige et calcaire, comme dans les Alpes", "Rouge sombre et ocre, comme une braise refroidie", "Gris et noir, comme du basalte"]',
  observation_bonne_reponse = 1
where id = 'roches-volcaniques';

update missions set
  rayon_approche_metres = 200,
  observation_type = 'orientation',
  observation_question = 'Tu es au sommet. Combien de directions différentes permets de voir le paysage ?',
  observation_choix = '["Une seule direction, vers la mer", "Deux côtés opposés, mer et montagne", "Un panorama complet à 360°"]',
  observation_bonne_reponse = 2
where id = 'sommet-vinaigre';
