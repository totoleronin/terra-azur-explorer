-- ============================================================
-- Terra Azur Explorer — Correction coordonnées GPS Baous
-- Basé sur timestamp EXIF jpg + corrélation trace GPX
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

-- Chapelle : timestamp exact jpg 12:26:23 UTC → point GPX 43.7559, 7.1243
update missions set lat = 43.755928, lng = 7.124306
where id = 'baous-chapelle';

-- Vue mer → repositionné au pont sur le Cagne (vallée, ~11:42 UTC)
update missions set
  lat = 43.750350, lng = 7.132800,
  titre = 'Le pont du Cagne',
  categorie = 'Point de vue',
  texte = 'Ce pont enjambe le Cagne, une rivière qui prend sa source dans les montagnes au-dessus de Vence et se jette dans la mer Méditerranée près de Cagnes-sur-Mer. En regardant depuis le pont, vers le sud tu aperçois la mer ! Le Cagne abrite des truites, des écrevisses et même des loutres qui ont fait leur retour ces dernières années.',
  question = 'Où se jette la rivière Cagne ?',
  choix = '["Dans le lac de Castillon", "Dans la mer Méditerranée près de Cagnes-sur-Mer", "Dans le Var"]',
  bonne_reponse = 1,
  indice = 'Regarde vers le sud depuis le pont, tu vois la mer ?'
where id = 'baous-vue-mer';

-- Falaises → panneau "Baou de Saint-Jeannet", entrée du sentier des falaises
update missions set lat = 43.752100, lng = 7.130700
where id = 'baous-falaises';

-- Roches + olivier : repositionné au pied des grandes dalles calcaires
update missions set lat = 43.754300, lng = 7.128500
where id = 'baous-oliviers';

-- Ajout de la mission "Sentier des chênes pubescents"
insert into missions (id, sentier_id, titre, categorie, lat, lng, rayon_metres, texte, question, choix, bonne_reponse, indice)
values (
  'baous-chenes', 'baous-saint-jeannet',
  'Le chêne pubescent', 'Plante',
  43.753400, 7.130200, 50,
  'Ces grands arbres qui forment un tunnel au-dessus du sentier sont des chênes pubescents ! On les appelle "pubescents" parce que leurs feuilles ont de petits poils doux dessous (essaie de les toucher !). Ils perdent leurs feuilles en hiver, contrairement aux chênes-verts qui restent verts toute l''année. Leurs glands nourrissent les geais, les écureuils et les sangliers.',
  'Comment reconnaît-on un chêne pubescent ?',
  '["Ses feuilles sont lisses et brillantes", "Ses feuilles ont de petits poils doux dessous", "Il ne fait jamais de glands"]',
  1,
  'Retourne une feuille et passe ton doigt dessus…'
)
on conflict (id) do nothing;
