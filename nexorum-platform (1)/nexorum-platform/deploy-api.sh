#!/bin/bash
cd apps/api
npm install
npx wrangler deploy --config wrangler.toml
