# Akka Quiz — Architecture Base de Données Supabase

> Schéma complet couvrant : Auth, Profils, Quiz, Gamification, Leaderboard, Admin, News
> Dernière mise à jour : 15 février 2025

Voir le fichier complet dans le projet Claude — ce fichier est la version de référence pushée sur GitHub.

## Tables (11)

1. `profiles` — Profil user + gamification + stats (→ auth.users)
2. `questions` — Banque de questions multilingue
3. `daily_quizzes` — Quiz du jour (5 question IDs)
4. `quiz_sessions` — Session d'un user (1/jour)
5. `quiz_answers` — Réponse individuelle par question
6. `badges_earned` — Badges débloqués
7. `streak_history` — Historique streak
8. `leaderboard_weekly` — Classement hebdomadaire
9. `ai_generation_batches` — Historique générations IA
10. `news_articles` — Articles News
11. `app_settings` — Config clé-valeur

## Statut

- Base créée ✅
- RLS activé ✅
- 9 settings seedés ✅
- Trigger auto-profil ✅
- Supabase Project: `tpkeqwmbjjycgmrwtidc`

## Schéma complet

Le schéma SQL complet avec CREATE TABLE, INDEX, RLS policies, triggers et seed data est disponible dans le document projet `SUPABASE_SCHEMA.md`.
