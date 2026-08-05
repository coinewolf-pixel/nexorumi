# 🏛 NEXORUM PLATFORM

AI-Native Gaming Ecosystem with multi-market economy, ML matchmaking, WebRTC voice, NFT marketplace, and AI bots.

## Architecture

```
NEXORUM
├── Global Market
├── Hunt Market
├── Racing Market
├── Fishing Market
├── Farm Market
└── Survival Market
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup Supabase**
   ```bash
   cd packages/database
   supabase start
   supabase migration up
   ```

3. **Run API (Cloudflare Workers)**
   ```bash
   npm run api:dev
   ```

4. **Run Web App**
   ```bash
   npm run web:dev
   ```

5. **Run Mobile App**
   ```bash
   npm run mobile:start
   ```

## Environment Variables

Create `.env` files:

**apps/api/.dev.vars**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret
```

**apps/web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database (18 Tables)

- profiles, wallets, staking_positions
- items, inventory, skins
- markets, matches, match_players
- parties, party_members, guilds, guild_members
- trades, transactions, leaderboard_entries
- reports, friendships, achievements

## Features

- ✅ ML Matchmaking (ELO, latency, playstyle, toxicity, role, activity)
- ✅ PWA with offline support
- ✅ React Native mobile app
- ✅ WebRTC voice chat
- ✅ NFT marketplace
- ✅ AI bots (OpenAI)
- ✅ NEXO token economy
- ✅ Multi-market trading
- ✅ Guilds, parties, friends
- ✅ Global leaderboard & achievements
