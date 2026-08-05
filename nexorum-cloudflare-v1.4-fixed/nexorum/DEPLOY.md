# NEXORUM — Deploy Guide (Fixed)

## ⚠️ IMPORTANT: wrangler.toml is ONLY for API (Workers)

For Web and Admin (Cloudflare Pages), do NOT include wrangler.toml in the upload.

## 1. Supabase

Run these SQL files in Supabase SQL Editor:
1. `packages/db/schema/nexorum_schema.sql`
2. `packages/db/schema/payments.sql`
3. `packages/db/schema/nft.sql`

## 2. API (Cloudflare Workers)

```bash
cd apps/api
npm install

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put NOWPAYMENTS_API_KEY
wrangler secret put NOWPAYMENTS_IPN_SECRET

# Create KV
wrangler kv:namespace create "NEXORUM_CACHE"
# Copy the id into apps/api/wrangler.toml

# Deploy
wrangler deploy
```

## 3. Web (Cloudflare Pages)

```bash
cd apps/web
npm install
npm run build

# Deploy ONLY the dist folder
wrangler pages deploy dist
```

**Do NOT upload the entire apps/web folder.** Only `dist/` contains the built static files.

Alternative: Drag & drop the `apps/web/dist` folder in Cloudflare Dashboard → Pages → Create project.

## 4. Admin (Cloudflare Pages)

```bash
cd apps/admin
npm install
npm run build
wrangler pages deploy dist
```

## 5. Mobile (Expo)

```bash
cd apps/mobile
npm install
npx expo start
# Scan QR with Expo Go app
```

## Troubleshooting

### "1 are unknown" error
This means you uploaded `wrangler.toml` to Pages. **Only upload the `dist/` folder.**

### Fix:
```bash
cd apps/web
npm run build
# Then deploy ONLY dist:
wrangler pages deploy dist
```

## Architecture

```
Cloudflare Workers (API)     ← wrangler.toml here ONLY
├── Durable Objects (Match rooms)
├── KV (Cache)
└── Supabase (PostgreSQL)

Cloudflare Pages (Web)       ← NO wrangler.toml
├── Static HTML/JS/CSS
└── PWA (manifest + SW)

Cloudflare Pages (Admin)     ← NO wrangler.toml
└── Static HTML/JS/CSS
```
