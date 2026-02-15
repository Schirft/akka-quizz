# Akka Quiz — Prompts IA de Génération de Questions

> Architecture complète des prompts pour la génération de questions via Claude Sonnet 4.5
> Dernière mise à jour : 15 février 2025

## Résumé

Ce document contient les prompts complets pour la génération IA de questions :

1. **System Prompt** — Envoyé à chaque appel Claude API. Définit le contexte Akka, la taxonomie (5 catégories), les niveaux de difficulté, le format de sortie JSON, et les règles qualité.

2. **User Prompt Templates** — 4 modes :
   - Auto (diversification toutes catégories)
   - Par catégorie
   - Par thème libre
   - Par URL (basé sur un article)

3. **Exemples dynamiques** — 3 questions piochées en DB injectées dans chaque prompt pour garantir la cohérence.

4. **Gestion des langues** — EN obligatoire, IT/ES optionnels. System prompt toujours en anglais.

5. **Architecture technique** — Batches de 5, max 3 parallèles, ~3-5s par appel, retry automatique.

6. **Coûts** — ~1.4¢/question, ~$2-7/mois.

7. **Statuts** — pending_review → approved / rejected / archived.

## Modèle utilisé

`claude-sonnet-4-5-20250514` via Supabase Edge Function `generate-questions`

## Document complet

Le document complet avec tous les prompts, exemples et architecture technique est disponible dans le projet Claude `AI_GENERATION_PROMPTS.md`.
