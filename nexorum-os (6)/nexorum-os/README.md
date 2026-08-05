# NEXORUM OS v1.3

Multi-game ecosystem platform with unified economy, AI matchmaking, and cross-platform support.

## Features

- **Design System** — 8-tier rarity, skin layers, token types
- **NEXO Economy** — Fixed supply, halving, staking tiers, cross-market exchange
- **Market API** — Unified interface for 6 markets
- **AI Matchmaking** — ML model with online learning (ELO, latency, playstyle, toxicity)
- **Real-time** — WebSocket match rooms via Durable Objects (20 TPS)
- **Social** — Parties, Guilds, P2P trading with escrow
- **Payments** — 100+ cryptocurrencies via NOWPayments
- **Admin Panel** — Full management interface
- **PWA** — Offline support, installable, push notifications
- **Mobile** — React Native (Expo) for iOS/Android

## Architecture

```
nexorum/
├── apps/
│   ├── web/          # Next.js 14 PWA
│   ├── admin/        # Admin dashboard
│   ├── api/          # Cloudflare Workers + Durable Objects
│   └── mobile/       # React Native (Expo)
├── packages/
│   ├── core/         # Game logic, economy, ML matchmaking
│   ├── db/           # Supabase schema + client
│   └── ui/           # Design system
```

## Quick Start

```bash
npm install

# API
cd apps/api && wrangler deploy

# Web PWA
cd apps/web && npm run build && wrangler pages deploy dist

# Mobile
cd apps/mobile && npx expo start
```

## Database

18 tables: profiles, wallets, staking, items, inventory, skins, markets, matches, parties, guilds, trades, transactions, leaderboards, reports, friendships, achievements, payments.

## ML Matchmaking

```typescript
const engine = new MLMatchmakingEngine();
const bestMatch = engine.findBestMatch(player, pool);
// Score: 0-100 based on ELO, latency, playstyle, toxicity, roles, activity
```

## Markets

| Market | Max | PvP | Duration |
|--------|-----|-----|----------|
| Hunt | 100 | Yes | 15 min |
| Racing | 50 | Yes | 5 min |
| Fishing | 200 | No | 30 min |
| Farm | 500 | No | 60 min |
| Survival | 80 | Yes | 20 min |
