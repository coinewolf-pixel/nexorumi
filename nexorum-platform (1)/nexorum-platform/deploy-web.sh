#!/bin/bash
cd apps/web
npm install
npm run build
npx wrangler pages deploy dist/ --project-name nexorum-web
