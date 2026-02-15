# Akka Quiz — PRD (Product Requirements Document)

> Version 1.1 — 15 février 2025
> Projet HD Conseils × Akka.app

---

## 1. Résumé

**Produit :** Webapp "Quiz of the Day" pour Akka, club d'investissement startup européen (+10 000 membres, +50M€ investis, licence AMF).

**Objectif :** Démo fonctionnelle pour convaincre le co-fondateur que notre méthodologie (automatisation + IA) est supérieure à leur approche manuelle.

**Cible :** 2 utilisateurs (CEO Thomas Rebaud + co-fondateur). Tous les users sont admin.

**URL :** app.hdconseils.com

---

## 2. Stack technique

| Composant | Technologie |
|-----------|------------|
| Frontend | Vite + React + Tailwind CSS |
| Backend / Auth / DB | Supabase (PostgreSQL, Auth email/password, Edge Functions, RLS) |
| Génération IA | Claude Sonnet 4.5 via Supabase Edge Function |
| News API | GNews API (clé : `53798e3ace1583384a27a73cdfb2bd19`) |
| Repo | github.com/hany8787/akka (privé) |
| Deploy | Dokploy sur VPS (app.hdconseils.com) |
| Supabase Project | ID: `tpkeqwmbjjycgmrwtidc` |

---

## 3. Responsive — Mobile-First

L'app est conçue **mobile-first** (iPhone 375px). Les fondateurs la testeront principalement sur téléphone. Le design Tailwind part du mobile et s'adapte vers le desktop (max-width 480px pour le player, plus large pour l'admin).

| Device | Priorité | Layout |
|--------|----------|--------|
| iPhone / Android (375-430px) | **P0 — Principal** | Full mobile, bottom tab bar, touch targets 44px min |
| Tablette (768px) | P2 | Centré, max-width container |
| Desktop (1024px+) | P2 — Admin surtout | Sidebar nav pour admin, quiz centré 480px max |

---

## 4. Pages de l'application

### 4.1 Player (10 pages)

**P1 — Login / Signup**
- Email + password (Supabase Auth)
- Bouton "Try Demo →" → connecte au compte `demo@akka.app` pré-rempli
- Choix langue (EN/FR/IT/ES) à la première connexion
- Mini-tuto 3 slides (skip possible) : Quiz daily, Streak/XP, Compete/Badges

**P2 — Home Dashboard**
- Streak card : X jours + flamme, 7 day-circles (L-D)
- Level card : nom du niveau, XP progress bar, "X / Y XP"
- Investor Score card : score /1000, évolution hebdo
- CTA vert "Start Quiz of the Day"
- Recent Badges (3 derniers) + "See all →"

**P3 — Quiz Question**
- Progress bar 5 segments + "1/5"
- Pill catégorie
- Texte de la question
- 4 answer cards (A/B/C/D) avec cercle lettre à gauche
- Timer bar en bas (15s), vert → jaune (5s) → rouge (3s), pulse à 3s
- Pas de tab bar pendant le quiz
- Animations : slide transition entre questions

**P4 — Quiz Feedback** (background #F7F9F8)
- Question + réponses avec états :
  - Correct : bordure verte, bg vert clair, checkmark
  - Incorrect : bordure rouge, bg rouge clair, X
  - Non sélectionnées : opacity 0.4
- "+20 XP" flottant, "⚡ +15" si speed bonus
- Bloc explication : bg vert clair, bordure gauche verte
- "How Akka members answered" : 4 barres horizontales + %
- CTA "Next Question →"

**P5 — Quiz Results**
- Cercle score "4/5" + message contextuel
- XP breakdown détaillé : quiz completion, correct answers, speed bonus, daily goal, streak multiplier × total
- Streak card : "X days 🔥"
- Boutons outline : "Leaderboard" + "Share"
- CTA "Continue"
- Animation confetti si 5/5

**P6 — Level Up Modal**
- Trophée en cercle vert
- Ancien titre barré → Nouveau titre en vert
- "Level X of 10"
- Card "NEW BENEFIT UNLOCKED"
- CTA "Continue"

**P7 — Leaderboard**
- Header : "Your Cohort · Q1 2026"
- Position du user : card highlight bordure verte
- 3 stat pills : Avg Score, Cohort Streak, Top Score
- Ranking complet : rank, avatar initiales, nom, streak, score
- 8 users fictifs seedés + user réel

**P8 — Profile**
- Avatar, display name, level, membre depuis
- Stats : quizzes, accuracy, longest streak, investor score
- Badges collection (tous avec état locked/unlocked)
- Switch langue (EN/FR/IT/ES)
- Bouton logout

**P9 — News Feed** (design DARK : bg #0B1A14)
- Header : "News" + search icon
- Pills filtre horizontal scroll : All, Funding, AI & Tech, IPOs & Exits, European Tech, VC & PE
- Featured article : image large + titre + source + date + pill catégorie
- Liste articles : thumbnail 64x64 + titre + snippet + source + date
- Tap → page preview light (hero image + titre + description + bouton "Read full article →" ouvre la source externe)
- Articles dans la langue du profil user

**P10 — Admin (bouton visible pour tous)**
- Voir section 4.2

### 4.2 Admin / Back-office (7 pages)

**A1 — Dashboard Admin**
- Stats : nb questions total, par statut, par catégorie, par source

**A2 — Questions Manager**
- Toggle vue : tableau / cards
- Filtres : catégorie, langue, statut, difficulté, source
- Pagination
- Actions : éditer, archiver, dupliquer

**A3 — Question Editor**
- CRUD manuel
- Champs multilingues (EN/FR/IT/ES)
- 4 réponses + sélection correcte
- Explication multilingue
- Catégorie, sous-catégorie, topic, difficulté

**A4 — AI Generator**
- Input nombre (1-200)
- Checkboxes langues (EN/FR/IT/ES)
- Dropdown difficulté (Easy/Medium/Hard)
- 4 modes :
  1. Auto (diversifié 5 catégories)
  2. Par catégorie (dropdown)
  3. Par thème libre (champ texte)
  4. Par URL (colle un article)
- Bouton "Générer"
- Progress bar + questions apparaissent au fur et à mesure

**A5 — AI Review**
- Liste questions générées (statut pending_review)
- Bouton "Approve All" / supprimer individuellement
- Preview de chaque question

**A6 — Quiz du Jour**
- Vue du quiz de demain (5 questions auto-piochées)
- Override possible : changer une question
- Historique des quiz passés

**A7 — Import / Export**
- Import Excel (format existant avec 332 questions)
- Export Excel de la banque

---

## 5. Design

### 5.1 Deux thèmes dans l'app

**Quiz & Admin = LIGHT (blanc)**
- Background : #FFFFFF (exception feedback : #F7F9F8)
- Cards : blanches, shadow subtile ou border #EBEBEB, radius 12-16px
- CTA : bg #1B3D2F, texte blanc, radius 12px, h 52px
- Accent positif : #2ECC71
- Accent négatif : #E74C3C
- Texte : #1A1A1A (primary), #6B7280 (secondary)
- Labels : uppercase, 11px, tracking-wide

**News = DARK (premium)**
- Background : gradient #0B1A14 → #132A1F
- Cards : rgba(255,255,255,0.04), border rgba(255,255,255,0.08), backdrop-blur
- Accent : #2ECC71
- Texte : #FFFFFF (primary), rgba(255,255,255,0.5) (secondary)

### 5.2 Typographie
- Font : Plus Jakarta Sans (ou Inter fallback)
- Moderne, clean, fintech

### 5.3 Navigation
- 5 onglets : Home, Quiz, News, Leaderboard, Profile
- Tab bar masquée pendant le quiz
- Bouton "Admin" dans le Profile ou header

### 5.4 Animations
- Slide transitions entre questions
- Shake + couleur sur feedback correct/incorrect
- XP counter incrémental
- Progress bar animée
- Confetti/particles sur perfect score 5/5
- Timer pulse quand < 3s
- Cards hover/tap feedback

---

## 6. Gamification

### 6.1 XP

| Action | XP |
|--------|-----|
| Quiz lancé | +5 |
| Réponse correcte (×5 max) | +20 |
| Speed bonus ≤ 3s | +15 |
| Speed bonus 4-7s | +5 |
| Quiz parfait 5/5 | +50 |
| Objectif quotidien | +100 |
| Streak maintenu | +10 × multiplier |

### 6.2 Streak
- Multiplier : min(1 + streak_days/50, 2.0)
- Cap 2.0× au jour 50
- 3 freezes/mois
- Reset à 04:00 CET

### 6.3 Niveaux (10)

| Niveau | Nom | XP requis |
|--------|-----|-----------|
| 1 | Initiate | 0 |
| 2 | Learner | 500 |
| 3 | Investor | 2000 |
| 4 | Analyst | 5000 |
| 5 | Angel | 10000 |
| 6 | Strategist | 25000 |
| 7 | Expert | 50000 |
| 8 | Visionary | 100000 |
| 9 | Legend | 200000 |
| 10 | Whale | 500000 |

### 6.4 Timer
- 15 secondes par question
- Vert → Jaune (5s) → Rouge (3s)
- Speed bonus : ≤3s = +15 XP, 4-7s = +5 XP, >7s = 0

### 6.5 Badges (15 total, 3 tiers)

**Common (5) :** First Steps, Week One, Rising Flame, Ten Percenter, Consistent
**Uncommon (6) :** Hot Streak, Centurion, Speed Demon, Scholar, Diversified, Night Owl
**Rare (4) :** Perfectionist, Marathon, Grandmaster, OG

### 6.6 Leaderboard
- Cohortes de 30 users
- Classement hebdomadaire par XP
- 7 ligues : Bronze → Silver → Gold → Platinum → Diamond → Emerald → Sapphire
- Promo/demo top/bottom 5

---

## 7. Génération IA

### 7.1 Architecture
- Modèle : Claude Sonnet 4.5
- Appel : Supabase Edge Function `generate-questions`
- Batch : 5 questions par appel API
- Parallélisation : max 3 appels simultanés
- Exemples : 3 questions dynamiques piochées en DB par catégorie

### 7.2 Taxonomie (5 macro-catégories)
1. Ecosystem & Culture
2. Foundational Knowledge
3. KPIs / Expert Knowledge
4. Trends & Tech
5. Startups vs. Other Asset Classes

### 7.3 Coûts
- ~1.4¢ par question
- Budget mensuel estimé : $2-7/mois

### 7.4 Prompt
Voir document séparé `AI_GENERATION_PROMPTS.md`

---

## 8. News

### 8.1 Source
- GNews API, free tier (100 req/jour)
- Clé : `53798e3ace1583384a27a73cdfb2bd19`

### 8.2 Architecture
- Cron 2x/jour (8h + 18h CET) via Edge Function `fetch-news`
- Search endpoint avec requêtes booléennes par catégorie
- 4 langues : EN/FR/IT/ES
- Stockage en DB table `news_articles`
- Le user charge depuis Supabase = instantané
- Délai free tier : 12h (acceptable)

### 8.3 Requêtes par catégorie
- Funding : `startup AND (funding OR "series A" OR "seed round")`
- AI & Tech : `(AI OR "artificial intelligence") AND startup`
- IPOs & Exits : `startup AND (IPO OR acquisition OR exit)`
- European Tech : `startup AND (Europe OR European) AND (unicorn OR funding)`
- VC & PE : `"venture capital" OR "private equity"`
- + Top Headlines technology (en fallback)

### 8.4 Affichage
- Feed : featured article (image large) + liste (thumbnail + titre + snippet)
- Tap → preview in-app (image + titre + description + bouton "Read full article")
- Filtres : All, Funding, AI & Tech, IPOs & Exits, European Tech, VC & PE

---

## 9. Base de données Supabase

### 9.1 Tables (11)
`profiles`, `questions`, `daily_quizzes`, `quiz_sessions`, `quiz_answers`, `badges_earned`, `leaderboard_weekly`, `streak_history`, `ai_generation_batches`, `news_articles`, `app_settings`

### 9.2 Statut
- Base créée et configurée ✅
- RLS activé avec policies simplifiées (démo) ✅
- 9 app_settings seedés ✅
- Trigger auto-création profil à l'inscription ✅

### 9.3 Schéma détaillé
Voir document séparé `SUPABASE_SCHEMA.md`

---

## 10. Onboarding & Mode Démo

### 10.1 Compte Démo
- Email : `demo@akka.app`
- Profil : Level 5 Angel, 12 350 XP, streak 35j, 42 quizzes, 80% accuracy
- 6 badges, investor score 847/1000, position 4ème leaderboard

### 10.2 Comptes CEO (pré-créés)
- Level 2 Learner, 800 XP, streak 5j, 7 quizzes
- 3 badges : First Steps, Week One, Rising Flame

### 10.3 Seed Leaderboard
- 8 users fictifs créés côté code au premier lancement

---

## 11. Edge Functions Supabase

| Function | Déclencheur | Rôle |
|----------|-------------|------|
| `generate-questions` | Admin click | Appelle Claude API, parse JSON, insère en DB |
| `schedule-daily-quiz` | Cron quotidien 00:01 | Pioche 5 questions (1/catégorie, pas servie récemment) |
| `process-quiz-completion` | Fin de quiz | Calcule XP, streak, badges, level, leaderboard |
| `check-streaks` | Cron quotidien 04:01 | Vérifie streaks, utilise freezes ou reset |
| `fetch-news` | Cron 2x/jour (8h+18h) | Fetch GNews, déduplique, insère en DB |

---

## 12. Priorités

| Priorité | Features |
|----------|---------|
| P1 MUST | Login, Home, Quiz (question→feedback→results), gamification (XP, streak, level) |
| P1 MUST | Admin : questions manager, AI generator, AI review |
| P2 SHOULD | Multilingue EN/FR/IT/ES, badges, leaderboard |
| P3 COULD | Import/Export Excel, quiz du jour auto, mode démo |
| P4 NICE | News feed, profile complet, animations avancées |

---

## 13. Contraintes

- **Mobile-first obligatoire** : les fondateurs testeront principalement sur iPhone. Touch targets 44px min, bottom tab bar, pas de hover-only interactions
- Responsive mobile-first (375px) mais fonctionnel desktop
- Validation requise avant chaque étape de dev
- Jamais écraser ou supprimer des données sans confirmation
- Code commenté et structuré
- Performance : quiz doit être fluide, pas de lag sur les transitions

---

*PRD v1.1 — Projet HD Conseils × Akka.app — 15 février 2025*
