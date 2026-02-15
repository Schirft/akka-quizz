# Akka Quiz

**Quiz of the Day** webapp for Akka, a European startup investment club.

## Stack

- **Frontend:** Vite + React + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- **AI:** Claude Sonnet 4.5 via Supabase Edge Functions
- **Deploy:** Docker + Hostinger VPS via GitHub Actions

## Development

```bash
# Install dependencies
npm install

# Create env file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start dev server
npm run dev
# -> http://localhost:5173

# Test on phone (same WiFi)
npm run dev -- --host
```

## Docker

```bash
docker compose --env-file .env.local build
docker compose --env-file .env.local up -d
# -> http://localhost:8080
```

## Deployment

Push to `main` triggers auto-deploy to Hostinger VPS via GitHub Actions.

```bash
git push origin main
```

## Project Structure

```
src/
  main.jsx              # App entry point
  App.jsx               # Router
  index.css             # Tailwind + Akka theme
  lib/supabase.js       # Supabase client
  contexts/             # React contexts (Auth)
  hooks/                # Custom hooks (useAuth, useProfile)
  components/layout/    # TabBar, PlayerLayout, AdminLayout
  components/ui/        # Button, Card, ProgressBar, Badge
  pages/auth/           # LoginPage
  pages/player/         # Home, Quiz, News, Leaderboard, Profile
  pages/admin/          # Dashboard, Questions, AI Generator, etc.
  config/               # Levels, badges, constants
```

## Documentation

See `docs/` folder:
- `PRD.md` — Product Requirements
- `DEPLOY.md` — Deployment guide
- `SUPABASE_SCHEMA.md` — Database schema
- `AI_GENERATION_PROMPTS.md` — AI generation system
- `GAMIFICATION_SYSTEM.md` — XP, levels, badges, streaks
