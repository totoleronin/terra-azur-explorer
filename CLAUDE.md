# Terra Azur Explorer — Contexte projet

PWA mobile-first de randonnée gamifiée pour familles (enfants 6–12 ans) sur la Côte d'Azur.
Concept : chasse au trésor pédagogique en pleine nature — l'enfant s'approche d'un point GPS, débloque une mission (quiz nature/géologie/histoire), et collectionne les illustrations gagnées.

L'utilisateur n'est **pas développeur** — toutes les modifications de code passent par toi. Réponses en français. Quand il y a ambiguïté, propose max 2 options.

**Vocabulaire impératif** : l'utilisateur est toujours « l'explorateur ». Jamais « joueur », « aventurier », « randonneur ». L'interface doit rester adulte et crédible, pas infantile.

---

## Stack technique

- **React 18** + **Vite 6** + **Tailwind CSS**
- **react-leaflet** + **OpenStreetMap** (carte temps réel, pas de tuiles payantes)
- **Supabase** (PostgreSQL + Row Level Security, lecture publique anonyme + Realtime pour collab)
- **PWA** — déploiement **Vercel** auto-déclenché par push sur `main` du repo GitHub `totoleronin/terra-azur-explorer`
- **Géolocalisation** native `navigator.geolocation.watchPosition`

Polices (Google Fonts) :
- `Bebas Neue` — titres condensés (h1, h2, gros affichage)
- `Lora` — labels serif (petites caps, sous-titres, légendes)
- `Inter` — corps de texte (UI courante, boutons, texte narratif)
- `Caveat` — exclusivement le carnet manuscrit du naturaliste

Tokens Tailwind : `font-title` (Bebas Neue) · `font-label` (Lora) · `font-body` (Inter) · `font-journal` (Caveat) · `font-mono` (alias Lora pour compatibilité)

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
│   ├── App.jsx                       # Pile de navigation (explore / team-setup / trail-detail / hike / mission / collection / profil)
│   ├── main.jsx
│   ├── index.css                     # Fonts, palette, animations (cardIn, fadeUp, missionReveal, missionGlowPulse…)
│   ├── components/
│   │   ├── BottomNav.jsx             # Tabs Carte / Carnet / Profil (sombre, fond #1f1c17)
│   │   ├── Illustration.jsx          # TrailIllustration + MissionIllustration (locked/nearby/unlocked)
│   │   ├── MiniMap.jsx               # Mini-carte Leaflet interactive sur l'accueil
│   │   ├── NarrativePage.jsx         # Page de carnet manuscrit (Caveat, parchemin, TTS / MP3)
│   │   └── TrailPreviewSheet.jsx     # (legacy, non utilisé actuellement)
│   ├── screens/
│   │   ├── ExploreScreen.jsx         # Accueil — header, mini-map, recherche, filtres, cards
│   │   ├── TrailDetailScreen.jsx     # Fiche sentier — hero illustré, stats, carnet de l'Explorateur, sticky CTA
│   │   ├── TeamSetupScreen.jsx       # Choix de mode — Solo/Famille / Collaboration
│   │   ├── HikeScreen.jsx            # Rando active — vraie carte Leaflet + HUD parchemin + tracé bicolore
│   │   ├── MissionScreen.jsx         # Quiz mission — hero locked → reveal unlocked sur bonne réponse + NarrativePage
│   │   ├── CollectionScreen.jsx      # Cartes collectionnées (à refondre design)
│   │   └── ProfilScreen.jsx          # Profil / azurs (à refondre design)
│   ├── hooks/
│   │   ├── useTrails.js              # useTrails() + useMissions(sentierId) + useAllMissions()
│   │   └── useNarrative.js           # useTrailNarrative(trailId) + useMissionNarrative(missionId)
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

### `trail_narrative`
| Colonne | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `trail_id` | text UNIQUE | ex. `mont-vinaigre` |
| `naturalist_name` | text | ex. "Jean-Baptiste Honnorat" |
| `naturalist_period` | text | ex. "1923" |
| `intro_text` | text | Texte d'introduction du sentier |
| `mystery_ending` | text | Dernière page mystérieuse |

### `mission_narrative`
| Colonne | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `mission_id` | text UNIQUE | Doit matcher `missions.id` |
| `page_number` | int | Numéro de page du carnet |
| `journal_text` | text | Texte manuscrit affiché en Caveat |
| `audio_url` | text (optionnel) | MP3 ; sinon fallback TTS Web Speech API |

### `sessions` (mode Collaboration)
| Colonne | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE | Format AZUR-XXXX |
| `trail_id` | text | |
| `host_name` | text | |
| `created_at` | timestamptz | |

### `session_participants`
| Colonne | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK | |
| `prenom` | text | |
| `joined_at` | timestamptz | |

### `session_progress`
| Colonne | Type | Note |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK | |
| `mission_id` | text | |
| `completed_by` | text | Prénom |
| `completed_at` | timestamptz | |

RLS : lecture publique anonyme via la clé `VITE_SUPABASE_ANON_KEY`.
Realtime activé sur `session_progress` pour la synchronisation collab.

### Scripts SQL (à exécuter dans l'ordre)
- `supabase_setup.sql` — création tables `sentiers` + `missions` + RLS + Mont Vinaigre initial
- `supabase_baous.sql` — Baous v1 (6 missions, obsolète)
- `supabase_routes.sql` — ajout colonne `route_coords` + tracés Baous & Mont Vinaigre
- `supabase_coords_fix.sql` — corrections coordonnées Baous (basé EXIF photos + GPX)
- `supabase_icones.sql` — ajout colonne `icone` + emojis Baous
- `supabase_baous_v2.sql` — **dernier Baous** : supprime les 6 anciennes missions, insère les **4 nouvelles**
- `supabase_sessions.sql` — tables `sessions`, `session_participants`, `session_progress` + Realtime
- `supabase_narrative.sql` — tables `trail_narrative`, `mission_narrative` + données Honnorat 1923 & Bellon 1908

---

## Fonctionnalités implémentées

### Navigation
- Pile `explore → trail-detail → team-setup → hike → mission` (App.jsx)
- BottomNav sombre `Carte · Carnet · Profil` (visible hors rando/mission)
- TeamSetupScreen inséré entre trail-detail et hike (sauté si équipe déjà configurée pour ce sentier)

### Écran Carte (Explore)
- Hero titre "OÙ PARTONS-NOUS AUJOURD'HUI ?" — "Où partons-" en Bebas Neue, "nous aujourd'hui ?" en vert `#1c4f4c` weight 400
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
- **Le carnet de l'Explorateur** : timeline checkpoints avec thumbnail mission illustré
  - État `unlocked` (collected) → vignette pleine couleur + ✓
  - État `nearby` (active = prochaine à faire) → silhouette + glow orange pulsant
  - État `locked` → silhouette grayscale + cadenas, titre masqué "???"
- Sticky CTA "Démarrer/Reprendre le sentier" (fond noir, ombre or)

### Écran Configuration équipe (TeamSetup)
- **Mode Solo/Famille** : nom d'équipe + jusqu'à 6 prénoms
- **Mode Collaboration** :
  - Hôte : génère un code AZUR-XXXX, crée session Supabase, partage via presse-papier
  - Rejoindre : saisie du code AZUR-XXXX + prénom, rejoint la session
- Persistance dans `localStorage.terra.team`
- Bypass automatique si l'équipe est déjà configurée pour ce sentier

### Écran Rando (Hike)
- **Vraie carte Leaflet + OpenStreetMap** (pas de stylisation décorative)
- Top bar : retour + badge "EN RANDO · timer"
- HUD chips : MISSIONS x/y · DISTANCE
- **Tracé bicolore** :
  - 🟢 vert (weight 5) pour la portion consommée
  - 🔴 rouge (weight 4) pour la portion restante + flèches directionnelles ▲
- Marqueurs missions : pastille rouge avec emoji `icone` (vert + ✓ si collected)
- Position utilisateur : point rouge + halo + cercle 50m de précision
- **Détection de proximité** : si distance < `rayon_metres` → bottom sheet "MISSION À PROXIMITÉ" + bouton Ouvrir
- Sinon bottom sheet "PROCHAINE MISSION" (preview next)
- Barre de progression bicolore (km/total + %)

### Écran Mission (Quiz)
- **Trame narrative** : page de carnet du naturaliste (NarrativePage) affichée avant la question
  - Caveat 22px, fond parchemin ligné, coin corné, bouton "▶ Écouter" (TTS fr-FR ou MP3)
  - Signature du naturaliste en bas (ex. "— Jean-Baptiste Honnorat, 1923")
  - Fallback sur `mission.texte` si aucune entrée en base
- Hero illustration en **état locked** (silhouette grayscale + ? overlay)
- Carte "✦ LA QUESTION" + 3 boutons A/B/C
- Mauvaise réponse → shake + état `nearby` (glow orange) + indice révélé
- Bonne réponse → overlay succès :
  - Illustration révélée en `missionReveal 1.5s` (silhouette → couleur)
  - Cachet ✓ vert incliné
  - "Bravo, explorateur !" + récompense `+50 azurs`
  - Bouton "Continuer l'exploration"
- Carte sauvegardée dans `localStorage.collected`

### Composant Illustration (3 états)
`<MissionIllustration mission={m} state="locked|nearby|unlocked" />`

- `locked` : `filter: grayscale(1) brightness(0.25)`, opacity 0.7, "?" overlay
- `nearby` : `filter: grayscale(1) brightness(0.3)`, opacity 0.9, overlay `<div>` séparé animé `missionGlowPulse 1.4s` (box-shadow orange)
- `unlocked` : animation `missionReveal 1.5s` (silhouette → couleur pleine)

⚠️ Le glow nearby est sur un `<div>` overlay séparé (pas sur le `<img>`) car les styles inline `filter` écrasent les keyframes CSS.

Si fichier `/public/illustrations/missions/<id>.png` manquant → placeholder rayé "asset à fournir".

### Composant NarrativePage
`<NarrativePage pageNumber={n} naturalist="Nom, 1923" text="..." audioUrl={url|null} />`

- Fond parchemin ligné (`repeating-linear-gradient`), coin corné haut-droite
- Texte en Caveat 22px, signature italique en bas
- Bouton "▶ Écouter / ⏹ Stop" :
  - Si `audioUrl` : lit le fichier MP3
  - Sinon : `SpeechSynthesisUtterance` (fr-FR, rate 0.95)

---

## État actuel des données

### Sentier 1 — Baous Saint-Jeannet (`baous-saint-jeannet`)
4.9 km · 1h30 · Facile · 4 missions — naturaliste **Henri Bellon, 1908**
1. **L'escalade du Baou** (Géologie) — `escalade-baou` ✓ illustration + page 1 narrative
2. **Le vautour fauve** (Animal) — `vautour-fauve` ✓ illustration + page 2 narrative
3. **Le chêne pubescent** (Plante) — `chene-pubescent` ✓ illustration + page 3 narrative
4. **Chapelle Notre-Dame des Baous** (Point de vue) — `chapelle-notre-dame` ✓ illustration + page 4 narrative (mystérieuse)

Tracé GPS : 44 points capturés depuis vraie rando GPX.

### Sentier 2 — Mont Vinaigre Estérel (`mont-vinaigre`)
5 km · 2h · Facile · 4 missions — naturaliste **Jean-Baptiste Honnorat, 1923**
1. **Le Chêne-liège** (Plante) — `chene-liege` ✓ illustration + page 1 narrative
2. **Le Bouquetin des Alpes** (Animal) — `bouquetin` ✓ illustration + page 2 narrative
3. **Les Roches Volcaniques** (Géologie) — `roches-volcaniques` ✓ illustration + page 3 narrative
4. **Sommet Mont Vinaigre** (Point de vue) — `sommet-vinaigre` ✓ illustration + page 4 narrative (mystérieuse)

Tracé GPS : 12 points fictifs.

---

## Ce qui marche fonctionnellement

✓ Supabase connecté · données chargées dynamiquement
✓ Carte Leaflet + OSM avec position GPS réelle
✓ Détection de proximité GPS (rayon configurable)
✓ Quiz multi-phases avec persistance localStorage
✓ Tracé bicolore qui suit la progression (vert consommé / rouge restant)
✓ 3 états d'illustration (locked/nearby/unlocked) avec animations
✓ Mini-carte tableau de bord interactive sur l'accueil
✓ Mode Solo/Famille : nom équipe + prénoms + persistance localStorage
✓ Mode Collaboration : génération code AZUR-XXXX + session Supabase + rejoindre
✓ Trame narrative naturaliste : page carnet Caveat avant chaque mission
✓ TTS Web Speech API (fr-FR) avec bouton Écouter/Stop
✓ Typographie Bebas Neue / Lora / Inter / Caveat en place
✓ PWA installable, déployée sur Vercel

---

## Ce qui reste à faire

### Refonte design (partiellement en cours)
- Écran **Carnet / Collection** — ancien design basique. À refondre en album de cartes postales penchées.
- Écran **Profil** — ancien design. À refondre avec rang explorateur, barre azurs, stats, mini-carte régionale, insignes.

### Fonctionnalités à implémenter (priorités 4–8)

**Priorité 4 — Mécanique d'observation**
- Processus en 3 étapes : approche GPS ("Tu approches de quelque chose...") → défi d'observation (QCM visuel/comportemental/sensoriel/orientation) → révélation + récompense
- Nouveau type de mission distinct du quiz classique

**Priorité 5 — Contenu saisonnier**
- Champs `season`, `time_of_day`, `weather` dans la table `missions`
- Intégration OpenWeatherMap pour afficher des infos contextuelles

**Priorité 6 — Validation photo + carte postale**
- Pour la dernière mission de chaque sentier : capture photo native
- Génération d'une carte postale souvenir (canvas HTML)

**Priorité 7 — Récap partageable**
- Image de fin de rando (canvas HTML, 1080×1080 + 1080×1920 stories)
- Share API native ou téléchargement

**Priorité 8 — Streaks & insignes**
- Table `badges` + 6 types d'insignes
- Système de racines / série de jours consécutifs

### Collab temps réel à finaliser
- `supabase_sessions.sql` exécuté et tables créées ✓
- HikeScreen : subscription Supabase Realtime à `session_progress` non encore câblée
- Affichage de la progression des autres membres en temps réel à implémenter

### Assets manquants
- Aucun pour l'instant — toutes les illustrations actives sont en place.

---

## Conventions de travail établies

- **Vocabulaire** : « explorateur » uniquement — jamais « joueur », « aventurier », « randonneur »
- **Pas de génération d'illustrations de substitution** : si un asset manque, afficher un placeholder neutre "asset à fournir"
- **ID mission = nom du fichier illustration** (sans extension) pour mapping automatique
- **Ne jamais toucher aux features fonctionnelles** (Supabase, GPS, Leaflet, proximité) sans demande explicite
- Code mobile-first, viewport 375px de référence
- Commits en français, signature `Co-Authored-By: Claude Sonnet 4.6`
- Push sur la branche du worktree → merge `main` pour déclencher Vercel
