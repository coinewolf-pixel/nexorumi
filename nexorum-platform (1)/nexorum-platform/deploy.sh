#!/bin/bash
set -e

echo "🚀 NEXORUM PLATFORM DEPLOY"
echo "==========================="

# 1. Deploy API (Cloudflare Workers)
echo "📡 Deploying API..."
cd apps/api
npm install
npx wrangler deploy --config wrangler.toml
cd ../..

# 2. Build & Deploy Web (Cloudflare Pages)
echo "🌐 Building Web..."
cd apps/web
npm install
npm run build
echo "🌐 Deploying Web to Cloudflare Pages..."
npx wrangler pages deploy dist/ --project-name nexorum-web
cd ../..

echo "✅ Deploy complete!"
echo "API: https://nexorum-api.YOUR_SUBDOMAIN.workers.dev"
echo "Web: https://nexorum-web.pages.dev"
