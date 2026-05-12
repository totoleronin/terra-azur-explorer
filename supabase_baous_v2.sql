-- ============================================================
-- Terra Azur Explorer — Mise à jour missions Baous (V2 : 4 missions)
-- Supprime les anciennes missions, insère les 4 nouvelles avec
-- les IDs qui correspondent aux fichiers illustration.
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

-- Supprime toutes les anciennes missions du sentier
delete from missions where sentier_id = 'baous-saint-jeannet';

-- Insère les 4 nouvelles missions (ordre du sentier)
insert into missions (id, sentier_id, titre, categorie, lat, lng, rayon_metres, texte, question, choix, bonne_reponse, indice, icone)
values
  (
    'escalade-baou', 'baous-saint-jeannet',
    'L''escalade du Baou', 'Géologie',
    43.752100, 7.130700, 60,
    'Le Baou de Saint-Jeannet est l''une des falaises de calcaire les plus célèbres de France pour l''escalade ! Plus de 200 voies y sont équipées. Les grimpeurs viennent du monde entier pour gravir ces parois verticales qui montent jusqu''à 400 mètres. Avant d''être un terrain de jeu, ces rochers étaient au fond d''une mer chaude il y a 100 millions d''années.',
    'Pourquoi le Baou attire-t-il les grimpeurs du monde entier ?',
    '["Parce qu''il y a une cascade", "Parce que c''est une grande falaise de calcaire bien équipée", "Parce qu''on y trouve des dinosaures"]',
    1,
    'Pense à la roche et à la hauteur…',
    '🧗'
  ),
  (
    'vautour-fauve', 'baous-saint-jeannet',
    'Le vautour fauve', 'Animal',
    43.753400, 7.130200, 60,
    'Lève la tête ! Avec un peu de chance, tu vois un vautour fauve planer au-dessus des falaises. Il a une envergure de 2,80 mètres, soit plus grande que ta voiture ! Il ne chasse pas : il se nourrit d''animaux déjà morts, et c''est lui qui nettoie la montagne. Sa vue est si perçante qu''il repère un repas à 4 km de distance.',
    'De quoi se nourrit le vautour fauve ?',
    '["Il chasse des lapins vivants", "Il mange des animaux déjà morts", "Il pêche dans la rivière"]',
    1,
    'C''est le grand nettoyeur des montagnes…',
    '🦅'
  ),
  (
    'chene-pubescent', 'baous-saint-jeannet',
    'Le chêne pubescent', 'Plante',
    43.753400, 7.130200, 50,
    'Ces grands arbres qui forment un tunnel au-dessus du sentier sont des chênes pubescents ! On les appelle "pubescents" parce que leurs feuilles ont de petits poils doux dessous (essaie de les toucher !). Ils perdent leurs feuilles en hiver, contrairement aux chênes-verts qui restent verts toute l''année. Leurs glands nourrissent les geais, les écureuils et les sangliers.',
    'Comment reconnaît-on un chêne pubescent ?',
    '["Ses feuilles sont lisses et brillantes", "Ses feuilles ont de petits poils doux dessous", "Il ne fait jamais de glands"]',
    1,
    'Retourne une feuille et passe ton doigt dessus…',
    '🌳'
  ),
  (
    'chapelle-notre-dame', 'baous-saint-jeannet',
    'Chapelle Notre-Dame des Baous', 'Point de vue',
    43.755928, 7.124306, 60,
    'Cette petite chapelle est nichée au pied de la grande falaise du Baou de Saint-Jeannet. Elle date du XVIIe siècle. Les habitants du village venaient y prier pour être protégés des orages et des mauvaises récoltes. Chaque année en mai, une procession monte jusqu''ici depuis le village. Depuis cette chapelle, le Baou culmine à 801 mètres d''altitude au-dessus de toi !',
    'À quelle altitude culmine le Baou de Saint-Jeannet ?',
    '["501 mètres", "801 mètres", "301 mètres"]',
    1,
    'Le chiffre commence par 8…',
    '🏠'
  );
