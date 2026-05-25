-- ============================================================
-- Terra Azur Explorer — Trame narrative naturaliste
-- Carnet d'un naturaliste historique, retrouvé page par page au fil
-- des missions. Affiché en style manuscrit (Caveat) avant chaque mission.
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

create table if not exists trail_narrative (
  id uuid primary key default gen_random_uuid(),
  trail_id text unique not null,
  naturalist_name text not null,
  naturalist_period text,                -- ex: "1923", "1908"
  intro_text text not null,
  mystery_ending text                    -- la dernière page / le mystère
);

create table if not exists mission_narrative (
  id uuid primary key default gen_random_uuid(),
  mission_id text unique not null,
  page_number int not null,
  journal_text text not null,            -- texte du carnet, manuscrit Caveat
  audio_url text                          -- optionnel, MP3 ; sinon TTS Web Speech
);

-- RLS — lecture publique anonyme
alter table trail_narrative enable row level security;
alter table mission_narrative enable row level security;
drop policy if exists "anon read narrative" on trail_narrative;
create policy "anon read narrative" on trail_narrative for select to anon using (true);
drop policy if exists "anon read mission narrative" on mission_narrative;
create policy "anon read mission narrative" on mission_narrative for select to anon using (true);

-- ── Mont Vinaigre — Jean-Baptiste Honnorat, 1923 ───────────
insert into trail_narrative (trail_id, naturalist_name, naturalist_period, intro_text, mystery_ending)
values (
  'mont-vinaigre',
  'Jean-Baptiste Honnorat',
  '1923',
  'Un naturaliste a exploré ce sentier il y a cent ans avant de disparaître mystérieusement. Son carnet a été retrouvé page par page sur les pentes du Mont Vinaigre. Chaque mission te permet de récupérer une page de son savoir.',
  'La dernière page du carnet est déchirée. Que pouvait-il bien écrire avant de disparaître ? Le mystère reste entier.'
)
on conflict (trail_id) do update set
  naturalist_name = excluded.naturalist_name,
  naturalist_period = excluded.naturalist_period,
  intro_text = excluded.intro_text,
  mystery_ending = excluded.mystery_ending;

insert into mission_narrative (mission_id, page_number, journal_text) values
  ('chene-liege', 1,
   '5 mai 1923. Le chêne-liège que j''observe ici a plus de cent ans. Son écorce, épaisse comme la paume d''une main, protège l''arbre des incendies qui balayent l''Estérel chaque été. Les bouchonniers de la région la récoltent tous les neuf ans — une saignée douce, qui ne tue pas. Je note : cinq individus dans ce vallon. Tous vigoureux.'),
  ('bouquetin', 2,
   '12 mai 1923. Hier au crépuscule, j''ai aperçu un mâle aux cornes annelées descendre l''arête nord. Sept printemps, au moins — j''ai compté les anneaux. Son sabot épouse la roche comme s''il en faisait partie. Je l''ai suivi à distance jusqu''à ce qu''il disparaisse dans les pins.'),
  ('roches-volcaniques', 3,
   '18 mai 1923. Cette terre rouge, sang figé du volcan, garde la mémoire d''un feu vieux de 250 millions d''années. La rhyolite, plus dure que mes outils, refuse de céder. Je n''emporterai pas d''échantillon — je dessinerai. Ici, la mer ressemble à de l''huile. Et le silence est total.'),
  ('sommet-vinaigre', 4,
   'Page déchirée. Il ne reste que quelques mots lisibles, à l''encre délavée : ''618 mètres… j''ai cru voir la Corse… et plus loin, quelque chose qui…''')
on conflict (mission_id) do update set
  page_number = excluded.page_number,
  journal_text = excluded.journal_text;

-- ── Baous Saint-Jeannet — Henri Bellon, 1908 ───────────────
insert into trail_narrative (trail_id, naturalist_name, naturalist_period, intro_text, mystery_ending)
values (
  'baous-saint-jeannet',
  'Henri Bellon',
  '1908',
  'En 1908, le botaniste Henri Bellon parcourt les Baous pour répertorier la flore et la faune des falaises. Son carnet de terrain a été retrouvé écorné par les ans dans une grotte. Chaque mission permet de récupérer une page de ses observations.',
  'Sa dernière page parle d''une rencontre étrange au pied de la chapelle. Mais l''encre s''est dissoute sous les pluies. Le reste de la phrase reste illisible.'
)
on conflict (trail_id) do update set
  naturalist_name = excluded.naturalist_name,
  naturalist_period = excluded.naturalist_period,
  intro_text = excluded.intro_text,
  mystery_ending = excluded.mystery_ending;

insert into mission_narrative (mission_id, page_number, journal_text) values
  ('escalade-baou', 1,
   '3 mars 1908. La paroi du Baou monte droit comme un mur, 400 mètres de calcaire blanc. Les bergers du village affirment qu''aucun homme n''y a posé le pied. Pourtant, j''ai cru voir des marques d''escalade — peut-être des cordées sauvages, peut-être autre chose. Je note avec prudence.'),
  ('vautour-fauve', 2,
   '11 mars 1908. Un grand oiseau a tournoyé au-dessus du sentier ce matin. Envergure : presque trois mètres. Plumage fauve, tête nue. Le vautour ne chasse pas, il dévore les morts — gardien silencieux de la montagne. J''ai senti son ombre passer sur moi comme une caresse.'),
  ('chene-pubescent', 3,
   '24 mars 1908. Les chênes pubescents forment ici une voûte basse. Sous le doigt, les feuilles ont la douceur d''un velours fané. Je suis prudent : ces arbres sont anciens, et la légende dit qu''ils gardent la mémoire des passants. Je les salue.'),
  ('chapelle-notre-dame', 4,
   'Page froissée, à demi effacée. ''… arrivé enfin à la chapelle. Sous le seuil, j''ai trouvé… '' Le reste a été lavé par les pluies. Seuls subsistent quelques mots : ''offrande'', ''lumière'', ''ne pas en parler''.')
on conflict (mission_id) do update set
  page_number = excluded.page_number,
  journal_text = excluded.journal_text;
