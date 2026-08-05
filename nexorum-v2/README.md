# 🏛 NEXORUM PLATFORM

## Deploy Frontend (Cloudflare Pages)

### Option 1: Drag & Drop (Easiest)
1. Go to https://dash.cloudflare.com → Pages → Create a project → Upload assets
2. Drag the `dist/` folder into the upload area
3. Done! Your site is live at `https://your-project.pages.dev`

### Option 2: Wrangler CLI
```bash
cd dist
npx wrangler pages deploy . --project-name nexorum-web
```

## Deploy API (Cloudflare Workers)

```bash
cd api
npm install

# Create .dev.vars with your keys:
echo "SUPABASE_URL=https://your-project.supabase.co" > .dev.vars
echo "SUPABASE_SERVICE_KEY=your-key" >> .dev.vars
echo "OPENAI_API_KEY=sk-your-key" >> .dev.vars
echo "JWT_SECRET=your-secret" >> .dev.vars

npx wrangler deploy
```

## Database Setup (Supabase)

```bash
cd packages/database  # (from full project)
supabase start
supabase migration up
psql $DATABASE_URL -f seed/seed.sql
```

## Features
- ✅ 5 Game Markets (Hunt, Racing, Fishing, Farm, Survival)
- ✅ NEXO Token Economy + Staking
- ✅ PWA (offline, installable, push notifications)
- ✅ Guilds, Leaderboard, NFT Marketplace
- ✅ AI Chat Bot, Voice Chat (WebRTC)
- ✅ ML Matchmaking (ELO, 6 features)
