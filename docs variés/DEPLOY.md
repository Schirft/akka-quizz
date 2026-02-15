# Akka Quiz — Guide de Déploiement

> Du `npm run dev` sur ton Mac Mini M4 à l'app live sur akka.hdconseils.com
> Zéro conflit avec tes autres apps.

---

## Vue d'ensemble du flow

```
Mac Mini M4 (dev local)        GitHub              VPS Hostinger
┌─────────────────────┐     ┌──────────┐     ┌──────────────────┐
│ npm run dev          │────▶│ git push │────▶│ Docker Manager   │
│ localhost:5173       │     │ main     │     │ akka.hdconseils.com│
│                     │     │          │     │ (container isolé) │
└─────────────────────┘     └──────────┘     └──────────────────┘
```

**3 étapes :**
1. Dev local → tu codes et testes sur localhost:5173
2. Build Docker → tu vérifies que le container tourne sur ton Mac
3. Deploy → push GitHub → Hostinger pull et deploy automatiquement

---

## ÉTAPE 1 — Dev Local (Mac Mini M4)

### 1.1 Cloner le repo et installer

```bash
cd ~/Projects
git clone https://github.com/hany8787/akka.git
cd akka
npm install
```

### 1.2 Créer le fichier .env.local

```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://tpkeqwmbjjycgmrwtidc.supabase.co
VITE_SUPABASE_ANON_KEY=ta_clé_anon_ici
EOF
```

### 1.3 Lancer le serveur de dev

```bash
npm run dev
# → http://localhost:5173
```

### 1.4 Tester sur téléphone (même WiFi)

```bash
npm run dev -- --host
# → http://192.168.1.XX:5173 (ouvrir sur iPhone)
```

---

## ÉTAPE 2 — Build Docker Local

### 2.1 Build et test

```bash
docker compose --env-file .env.local build
docker compose --env-file .env.local up -d
# → http://localhost:8080
docker compose down
```

---

## ÉTAPE 3 — Deploy sur Hostinger VPS

### 3.1 DNS (déjà fait ✅)
Enregistrement A : `akka` → `217.65.144.106`

### 3.2 Deploy auto via GitHub Actions
À chaque `git push origin main`, Hostinger redéploie automatiquement.

**GitHub Secrets configurés ✅ :**
- `HOSTINGER_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Variable `HOSTINGER_VM_ID` = `865113`

**Workflow : `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Hostinger
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Hostinger
        uses: hostinger/deploy-on-vps@v2
        with:
          api-key: ${{ secrets.HOSTINGER_API_KEY }}
          virtual-machine: ${{ vars.HOSTINGER_VM_ID }}
          project-name: akka-quiz
          environment-variables: |
            VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
            VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

### 3.3 Configurer le domaine dans Docker Manager
1. hPanel → VPS → Docker Manager → projet akka-quiz
2. Settings → Domaine : `akka.hdconseils.com`
3. Activer SSL (Let's Encrypt auto)

---

## Workflow quotidien

```bash
cd ~/Projects/akka
npm run dev -- --host        # dev + test mobile
# ... code ...
git add . && git commit -m "feat: leaderboard"
git push origin main         # → auto deploy ~2min
```

### Debug via SSH

```bash
ssh root@217.65.144.106
docker ps
docker logs akka-quiz
```

---

## Fichiers Docker (créés par Claude Code)

- `Dockerfile` — Multi-stage: node build + nginx serve
- `docker-compose.yml` — Config container + env vars
- `nginx.conf` — SPA routing + cache statique
- `.dockerignore` — Exclut node_modules, .env, .git
- `.github/workflows/deploy.yml` — Auto-deploy

---

## Checklist avant démo CEO

- [ ] App live sur akka.hdconseils.com avec SSL
- [ ] Compte demo@akka.app fonctionnel
- [ ] Quiz 5 questions → feedback → results
- [ ] Admin : générer questions IA en direct
- [ ] Tester iPhone Safari + Chrome Desktop
- [ ] Leaderboard avec 8 users fictifs
- [ ] News feed avec articles

---

*Guide v1.0 — Projet HD Conseils × Akka.app — Février 2025*
