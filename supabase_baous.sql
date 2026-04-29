-- ============================================================
-- Terra Azur Explorer — Chapelle Notre-Dame des Baous
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

insert into sentiers (id, nom, description, lat_depart, lng_depart, difficulte, duree, distance_km)
values (
  'baous-saint-jeannet',
  'Chapelle Notre-Dame des Baous',
  'Une boucle magique depuis le village perché de Saint-Jeannet jusqu''à la chapelle cachée sous les falaises des Baous. Vue imprenable sur la Côte d''Azur !',
  43.749032, 7.143735,
  'Facile', '1h30', 4.9
)
on conflict (id) do nothing;

insert into missions (id, sentier_id, titre, categorie, lat, lng, rayon_metres, texte, question, choix, bonne_reponse, indice)
values
  (
    'saint-jeannet-village', 'baous-saint-jeannet',
    'Saint-Jeannet, village perché', 'Point de vue',
    43.749032, 7.143735, 60,
    'Saint-Jeannet est un village médiéval construit à 500 mètres d''altitude sur le bord d''une falaise ! Ses habitants construisaient leurs maisons en hauteur pour se protéger des pirates qui pillaient les côtes au Moyen Âge. D''ici, par temps clair, on voit jusqu''aux Alpes enneigées !',
    'Pourquoi les villages provençaux étaient-ils construits en hauteur ?',
    '["Pour avoir plus de vent frais", "Pour se protéger des pirates et des envahisseurs", "Pour être plus près des nuages"]',
    1, 'Pense à ce qui rendait la mer dangereuse au Moyen Âge…'
  ),
  (
    'baous-oliviers', 'baous-saint-jeannet',
    'Les oliviers centenaires', 'Plante',
    43.748200, 7.140800, 50,
    'Ces oliviers tordus ont peut-être 200, 300, voire 500 ans ! L''olivier est l''arbre symbole de Provence. Il pousse très lentement — seulement 1 cm par an — mais peut vivre plus de 2000 ans. Ses petites olives noires ou vertes donnent l''huile d''olive qu''on utilise pour cuisiner.',
    'Combien de temps peut vivre un olivier ?',
    '["100 ans maximum", "500 ans maximum", "Plus de 2000 ans"]',
    2, 'C''est plus vieux que Jésus-Christ !'
  ),
  (
    'baous-vue-mer', 'baous-saint-jeannet',
    'Panorama Côte d''Azur', 'Point de vue',
    43.750900, 7.131800, 60,
    'Regarde vers le sud ! Tu peux voir la mer Méditerranée, la presqu''île d''Antibes, et par temps très clair, les îles de Lérins. La Côte d''Azur doit son nom à la couleur bleu intense de la mer et du ciel. L''eau est bleue parce qu''elle absorbe les couleurs rouges et jaunes de la lumière, et réfléchit le bleu.',
    'Pourquoi la mer Méditerranée est-elle si bleue ?',
    '["Elle est peinte en bleu", "Elle réfléchit la couleur du ciel uniquement", "Elle absorbe les autres couleurs et réfléchit le bleu"]',
    2, 'C''est une question de physique de la lumière !'
  ),
  (
    'baous-falaises', 'baous-saint-jeannet',
    'Les falaises des Baous', 'Géologie',
    43.753700, 7.129800, 60,
    'Ces immenses falaises calcaires s''appellent les Baous (du provençal "baù" qui veut dire "falaise"). Elles se sont formées il y a 100 millions d''années au fond d''une mer tropicale ! Les roches calcaires sont faites de milliards de coquillages et coraux fossilisés compressés. Aujourd''hui, les grimpeurs adorent escalader ces parois verticales.',
    'De quoi est composé le calcaire des falaises ?',
    '["De sable compressé", "De coquillages et coraux fossilisés", "De lave volcanique refroidie"]',
    1, 'Cherche de petits fossiles dans les roches autour de toi…'
  ),
  (
    'baous-chapelle', 'baous-saint-jeannet',
    'Chapelle Notre-Dame des Baous', 'Point de vue',
    43.754500, 7.128200, 60,
    'Cette petite chapelle est nichée au pied de la grande falaise du Baou de Saint-Jeannet. Elle date du XVIIe siècle. Les habitants du village venaient y prier pour être protégés des orages et des mauvaises récoltes. Chaque année en mai, une procession monte jusqu''ici depuis le village. Depuis cette chapelle, le Baou culmine à 801 mètres d''altitude au-dessus de toi !',
    'À quelle altitude culmine le Baou de Saint-Jeannet ?',
    '["501 mètres", "801 mètres", "301 mètres"]',
    1, 'Le chiffre commence par 8…'
  )
on conflict (id) do nothing;
