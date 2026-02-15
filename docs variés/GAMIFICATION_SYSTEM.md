# Akka Quiz — Système de Gamification Complet

> Document de référence pour l'implémentation du système de gamification
> Dernière mise à jour : 15 février 2025

## Résumé

### XP System
- Quiz lancé: +5, Correct: +20, Speed ≤3s: +15, Speed 4-7s: +5
- Perfect 5/5: +50, Daily goal: +100, Streak: +10 × multiplier
- Formule: `XP = base × min(1 + streak/50, 2.0)`

### 10 Niveaux
Initiate(0) → Learner(500) → Investor(2K) → Analyst(5K) → Angel(12K) → Strategist(25K) → Expert(50K) → Visionary(100K) → Legend(200K) → Whale(500K)

### Streak
- Reset 04:00 CET, 3 freezes/mois
- Multiplier cap 2.0× au jour 50

### 15 Badges (3 tiers)
- Common (5): First Steps, Week One, Quiz Starter, Curious Mind, Early Bird
- Uncommon (6): Rising Flame, Consistent Investor, Dedicated, Speed Racer, Accuracy Master, Night Owl
- Rare (4): Streak Legend, Centurion, Market Expert, Contrarian

### Leaderboard
- Cohortes 30 users, hebdomadaire
- 7 ligues: Bronze → Silver → Gold → Emerald → Diamond → Ruby → Sapphire
- Top 5 promu, bottom 5 rétrogradé

### Timer
- 15s par question
- Vert → Jaune (5s) → Rouge (3s)

## Document complet

Le document complet avec toutes les formules JS, wireframes, seed data et boucle d'engagement est disponible dans le projet Claude `GAMIFICATION_SYSTEM.md`.
