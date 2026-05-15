# Terra Azur Explorer — Contexte projet

PWA mobile-first de randonnée gamifiée pour familles (enfants 6–12 ans) sur la Côte d'Azur.
Concept : chasse au trésor pédagogique en pleine nature — l'enfant s'approche d'un point GPS, débloque une mission (quiz nature/géologie/histoire), et collectionne les illustrations gagnées.

L'utilisateur n'est **pas développeur** — toutes les modifications de code passent par toi. Réponses en français. Quand il y a ambiguïté, propose max 2 options.

---

## Stack technique

- **React 18** + **Vite 6** + **Tailwind CSS**
- **react-leaflet** + **OpenStreetMap** (carte temps réel, pas de tuiles payantes)
- **Supabase** (PostgreSQL + Row Level Security, lecture publique anonyme)
- **PWA** — déploiement **Vercel** auto-déclenché par push sur `main` du repo GitHub `totoleronin/terra-azur-explorer`
- **Géolocalisation** native `navigator.geolocation.watchPosition`

Polices (Google Fonts) : `Caveat` (titres manuscrits), `Patrick Hand` (corps), `Special Elite` (petites caps mono).

Palette parchemin/aquarelle :
- Parchment : `#f4ecd8` → `#ebe0c2` (clair → fond), `#c9b78a` (bordures), `#8a7e6c` (texte mute)
- Ink : `#2b2620` (encre noire), `#5a4f42` (gris)
- Accents : `#a14a3c` (rouge Estérel · état actif), `#4a6b3a` (vert · validé), `#b8862e` (or aventure), `#1c4f4c` (vert pin)

---

## Structure du projet

```
.
├── CLAUDE.md                         # Ce fichier
├── .env                              # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── public/illustrations/
│   ├── trails/<trail-id>.png         # Couverture sentier
│   ├── missions/<mission-id>.png     # Carte de collection (3 états)
│   └── kit/                          # Illustrations placeholder du design kit
├── src/
│   ├── App.jsx                       # Pile de navigation (explore / trail-detail / hike / mission / collection / profil)
│   ├── main.jsx
│   ├── index.css                     # Fonts, palette, animations (cardIn, fadeUp, missionReveal, missionGlowPulse...)
│   ├── components/
│   │   ├── BottomNav.jsx             # Tabs Carte / Carnet / Profil (sombre, fond #1f1c17)
│   │   ├── Illustration.jsx          # TrailIllustration + MissionIllustration (locked/nearby/unlocked)
│   │   ├── MiniMap.jsx               # Mini-carte Leaflet en haut de l'écran d'accueil
│   │   └── TrailPreviewSheet.jsx     # (legacy, non utilisé actuellement)
│   ├── screens/
│   │   ├── ExploreScreen.jsx         # Accueil — header, mini-map, recherche, filtres, cards
│   │   ├── TrailDetailScreen.jsx     # Fiche sentier — hero illustré, stats, carnet d'aventure, sticky CTA
│   │   ├── HikeScreen.jsx            # Rando active — vraie carte Leaflet + HUD parchemin + tracé bicolore
│   │   ├── MissionScreen.jsx         # Quiz mission — hero locked → reveal unlocked sur bonne réponse
│   │   ├── CollectionScreen.jsx      # Cartes collectionnées (à refondre design)
│   │   └── ProfilScreen.jsx          # Profil / azurs (à refondre design)
│   ├── hooks/
│   │   └── useTrails.js              # useTrails() + useMissions(sentierId) + useAllMissions()
│   ├── lib/
│   │   ├── supabase.js               # Client Supabase
│   │   └── geo.js                    # distanceMetres(lat1,lng1,lat2,lng2)
│   └── data/
│       └── seeds.js                  # Données fallback hors-ligne
└── supabase_*.sql                    # Scripts SQL à coller dans Supabase SQL Editor
```

---

## Tables Supabase

### `sentiers`
| Colonne | Type | Note |
|---|---|---|
| `id` | text PK | ex. `baous-saint-jeannet` |
| `nom` | text | |
| `description` | text | |
| `lat_depart`, `lng_depart` | float | Point de départ |
| `difficulte` | text | Facile / Moyen / Difficile |
| `duree` | text | ex. "1h30" |
| `distance_km` | float | |
| `route_coords` | jsonb | Tableau `[[lat,lng],...]` du tracé GPX simplifié |
| `region` | text (optionnel) | |

### `missions`
| Colonne | Type | Note |
|---|---|---|
| `id` | text PK | ex. `chapelle-notre-dame` — **doit matcher** le nom du fichier `/public/illustrations/missions/<id>.png` |
| `sentier_id` | text FK | |
| `titre`, `categorie` | text | Categorie : Plante / Animal / Géologie / Point de vue |
| `lat`, `lng`, `rayon_metres` | float / int | rayon par défaut 50m |
| `texte` | text | Récit pédagogique |
| `question`, `choix`, `bonne_reponse`, `indice` | text / jsonb / int / text | QCM |
| `icone` | text | Emoji custom (🏠 🌉 🪨 etc.) |

RLS : lecture publique anonyme via la clé `VITE_SUPABASE_ANON_KEY`.

### Scripts SQL existants
- `supabase_setup.sql` — création tables + RLS + Mont Vinaigre initial
- `supabase_baous.sql` — Baous v1 (6 missions, obsolète)
- `supabase_routes.sql` — ajout colonne `route_coords` + tracés Baous & Mont Vinaigre
- `supabase_coords_fix.sql` — corrections coordonnées Baous (basé EXIF photos + GPX)
- `supabase_icones.sql` — ajout colonne `icone` + emojis Baous
- `supabase_baous_v2.sql` — **dernier en date** : supprime les 6 anciennes missions Baous, insère les **4 nouvelles** (escalade, vautour, chêne pubescent, chapelle)

---

## Fonctionnalités implémentées

### Navigation
- Pile `explore → trail-detail → hike → mission` (App.jsx gère screen + tab)
- BottomNav sombre `Carte · Carnet · Profil` (visible hors rando/mission)

### Écran Carte (Explore)
- Header Terra Azur (logo T + version)
- **Mini-carte Leaflet interactive** (hauteur ~200px) avec 3 types de marqueurs :
  - 🟢 vert = sentier terminé · 🟠 orange = en cours · ⚪ gris = disponible
  - Clic sur marqueur → ouvre détail sentier
  - Légende en bas (z-index 400 au-dessus des panes Leaflet)
- Recherche + 5 filtres (Tous, Famille, Court, Mer, Forêt)
- Cards sentier : illustration plein bleed + badge difficulté + chip missions + stats

### Écran Sentier (TrailDetail)
- Hero illustré plein bleed avec parallax au scroll + titre superposé
- Top bar transparent → opaque après scroll
- Boutons favori (★) + téléchargement (carte hors-ligne / cahier PDF placeholder)
- 4 stat tiles (Distance / Durée / Difficulté / Missions)
- **Carnet d'aventure** : timeline checkpoints avec thumbnail mission illustré
  - État `unlocked` (collected) → vignette pleine couleur + ✓
  - État `nearby` (active = prochaine à faire) → silhouette + glow orange pulsant
  - État `locked` → silhouette grayscale + cadenas, titre masqué "???"
- Sticky CTA "Démarrer/Reprendre l'aventure" (fond noir, ombre or)

### Écran Rando (Hike)
- **Vraie carte Leaflet + OpenStreetMap** (pas de stylisation décorative)
- Top bar : retour + badge "EN RANDO · timer"
- HUD chips : MISSIONS x/y · DISTANCE
- **Tracé bicolore** :
  - 🟢 vert pour la portion consommée (du départ à la dernière mission complétée OU position actuelle)
  - 🔴 rouge pour la portion restante
  - Flèches directionnelles ▲ sur la portion restante uniquement
- Marqueurs missions : pastille rouge avec emoji `icone` (vert + ✓ si collected)
- Position utilisateur : point rouge + halo + cercle 50m de précision
- **Détection de proximité** : si distance utilisateur ↔ mission < `rayon_metres`, bottom sheet "MISSION À PROXIMITÉ" + bouton Ouvrir
- Sinon bottom sheet "PROCHAINE MISSION" (preview next)
- Barre de progression bicolore (km/total + %)

### Écran Mission (Quiz)
- Hero illustration en **état locked** (silhouette grayscale + ? overlay)
- Carte "✦ LE CARNET" (texte narratif) + carte "✦ LA QUESTION"
- 3 boutons A/B/C
- Mauvaise réponse → shake + indice révélé
- Bonne réponse → overlay succès avec :
  - **Carte de collection** révélée en fade-in 1.5s (silhouette → couleur)
  - Cachet ✓ vert
  - "Bravo, explorateur !" + récompense `+50 azurs`
  - Bouton "Continuer l'aventure"
- Carte sauvegardée dans `localStorage.collected`

### Composant Illustration (3 états)
`<MissionIllustration mission={m} state="locked|nearby|unlocked" />`

- `locked` : `filter: grayscale(1) brightness(0.25)`, opacity 0.7, "?" overlay
- `nearby` : `filter: grayscale(1) brightness(0.3)`, opacity 0.9, overlay animé `missionGlowPulse 1.4s` (ring + halo orange)
- `unlocked` : animation `missionReveal 1.5s` (silhouette → couleur pleine)

Si fichier `/public/illustrations/missions/<id>.png` manquant → placeholder rayé "asset à fournir" (pas de substitution).

---

## État actuel des données

### Sentier 1 — Baous Saint-Jeannet (`baous-saint-jeannet`)
4.9 km · 1h30 · Facile · 4 missions
1. **L'escalade du Baou** (Géologie) — `escalade-baou` ✓ illustration
2. **Le vautour fauve** (Animal) — `vautour-fauve` ✓ illustration
3. **Le chêne pubescent** (Plante) — `chene-pubescent` ✓ illustration
4. **Chapelle Notre-Dame des Baous** (Point de vue) — `chapelle-notre-dame` ✓ illustration

Tracé GPS : 44 points capturés depuis vraie rando GPX, stockés dans `sentiers.route_coords`.

### Sentier 2 — Mont Vinaigre Estérel (`mont-vinaigre`)
5 km · 2h · Facile · 4 missions
1. **Le Chêne-liège** (Plante) — `chene-liege` ✓ illustration
2. **Le Bouquetin des Alpes** (Animal) — `bouquetin` ✓ illustration
3. **Les Roches Volcaniques** (Géologie) — `roches-volcaniques` ✓ illustration
4. **Sommet Mont Vinaigre** (Point de vue) — `sommet-vinaigre` ✓ illustration

Tracé GPS : 12 points fictifs (pas de vraie rando faite).

---

## Ce qui marche fonctionnellement

✓ Supabase connecté · données chargées dynamiquement
✓ Carte Leaflet + OSM avec position GPS réelle
✓ Détection de proximité GPS (rayon configurable)
✓ Quiz multi-phases avec persistance localStorage
✓ Tracé bicolore qui suit la progression
✓ 3 états d'illustration (locked/nearby/unlocked) avec animations
✓ Mini-carte tableau de bord sur l'accueil
✓ PWA installable, déployée sur Vercel

---

## Ce qui reste à faire

### Refonte design (en cours)
- Écran **Carnet / Collection** — toujours dans l'ancien design (cartes-grille basique). À refondre en album de cartes postales penchées comme spec design hi-fi.
- Écran **Profil** — toujours dans l'ancien design. À refondre avec rang explorateur, barre azurs, stats, mini-carte régionale, insignes.

### Features potentielles évoquées
- **Audio géolocalisé** (TTS ou enregistrements voix parent) — non démarré, le user voulait tester la V1 d'abord
- **Cahier PDF imprimable** — UI bottom sheet placeholder en place, génération à faire
- **Carte hors-ligne** — UI placeholder
- **Mode parent / création de sentier** — non démarré

### Assets manquants
- Aucun pour l'instant — toutes les illustrations actives sont en place (`/public/illustrations/trails/*.png` et `/public/illustrations/missions/*.png`).

---

## Conventions de travail établies

- **Pas de génération d'illustrations de substitution** : si un asset manque, afficher un placeholder neutre "asset à fournir" et le signaler au user
- **ID mission = nom du fichier illustration** (sans extension) pour mapping automatique
- **Ne jamais toucher aux features fonctionnelles** (Supabase, GPS, Leaflet, proximité) sans demande explicite — la V1 est validée
- Code mobile-first, viewport 375px de référence
- Commits en français, signature `Co-Authored-By: Claude Sonnet 4.6`
- Push sur la branche du worktree → merge `main` pour déclencher Vercel
