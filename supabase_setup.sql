-- ============================================================
-- Terra Azur Explorer — Setup Supabase
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

-- Table sentiers
create table if not exists sentiers (
  id           text primary key,
  nom          text not null,
  description  text,
  lat_depart   double precision not null,
  lng_depart   double precision not null,
  difficulte   text default 'Facile',
  duree        text,
  distance_km  numeric,
  illustration text,
  created_at   timestamptz default now()
);

-- Table missions
create table if not exists missions (
  id             text primary key,
  sentier_id     text references sentiers(id) on delete cascade,
  titre          text not null,
  categorie      text,
  lat            double precision not null,
  lng            double precision not null,
  rayon_metres   int default 50,
  texte          text,
  question       text,
  choix          jsonb,
  bonne_reponse  int,
  indice         text,
  created_at     timestamptz default now()
);

-- Lecture publique (pas besoin d'être connecté pour lire les sentiers)
alter table sentiers enable row level security;
alter table missions enable row level security;

create policy "lecture publique sentiers"
  on sentiers for select using (true);

create policy "lecture publique missions"
  on missions for select using (true);

create policy "ecriture admin sentiers"
  on sentiers for all using (auth.role() = 'authenticated');

create policy "ecriture admin missions"
  on missions for all using (auth.role() = 'authenticated');

-- ============================================================
-- Données : Mont Vinaigre
-- ============================================================

insert into sentiers (id, nom, description, lat_depart, lng_depart, difficulte, duree, distance_km)
values (
  'mont-vinaigre',
  'Mont Vinaigre — Estérel',
  'Découvrez les trésors naturels de l''Estérel entre forêts de pins et roches volcaniques.',
  43.5167, 6.8833,
  'Facile', '2h', 5
)
on conflict (id) do nothing;

insert into missions (id, sentier_id, titre, categorie, lat, lng, rayon_metres, texte, question, choix, bonne_reponse, indice)
values
  (
    'chene-liege', 'mont-vinaigre',
    'Le Chêne-liège', 'Plante',
    43.517, 6.884, 50,
    'Le chêne-liège est un arbre magique : son écorce épaisse et spongieuse est récoltée tous les 9 ans pour fabriquer des bouchons de bouteille ! Il résiste même aux incendies grâce à cette armure naturelle.',
    'À quoi sert l''écorce du chêne-liège ?',
    '["Faire des bouchons de bouteille", "Fabriquer du papier", "Nourrir les animaux"]',
    0, 'Pense aux bouteilles de vin ou de jus de fruits…'
  ),
  (
    'bouquetin', 'mont-vinaigre',
    'Le Bouquetin des Alpes', 'Animal',
    43.519, 6.887, 50,
    'Le bouquetin est un grimpeur extraordinaire ! Ses sabots ont des bords durs et un centre souple, comme des chaussures d''escalade naturelles. Les mâles portent de grandes cornes annelées qui peuvent mesurer 1 mètre !',
    'Comment le bouquetin grimpe-t-il si bien ?',
    '["Il a des griffes", "Ses sabots sont parfaits pour l''escalade", "Il vole un peu"]',
    1, 'Regarde sous ses pieds…'
  ),
  (
    'roches-volcaniques', 'mont-vinaigre',
    'Les Roches Volcaniques', 'Géologie',
    43.521, 6.889, 50,
    'Ces roches rouges et orangées ont été crachées par des volcans il y a 250 millions d''années ! L''Estérel est l''un des massifs les plus anciens de France. La roche principale s''appelle le rhyolite.',
    'Quel âge ont les roches volcaniques de l''Estérel ?',
    '["1 000 ans", "1 million d''années", "250 millions d''années"]',
    2, 'C''est très très vieux… même plus vieux que les dinosaures !'
  ),
  (
    'sommet-vinaigre', 'mont-vinaigre',
    'Sommet Mont Vinaigre', 'Point de vue',
    43.523, 6.891, 50,
    'Tu as atteint le point culminant de l''Estérel à 618 mètres d''altitude ! Par temps clair, tu peux voir les îles de Lérins, le massif des Maures, et même parfois la Corse à l''horizon.',
    'Quelle est l''altitude du Mont Vinaigre ?',
    '["418 mètres", "618 mètres", "818 mètres"]',
    1, 'Le chiffre commence par 6…'
  )
on conflict (id) do nothing;
