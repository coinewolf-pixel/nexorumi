// =====================================================
// NEXORUM API MAIN ENTRY
// Cloudflare Workers + Hono + Durable Objects
// =====================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Env } from './types';

import auth from './routes/auth';
import profiles from './routes/profile';
import wallet from './routes/wallet';
import markets from './routes/market';
import matchmaking from './routes/matchmaking';
import guilds from './routes/guild';
import parties from './routes/party';
import leaderboard from './routes/leaderboard';
import ai from './routes/ai';
import voice from './routes/webrtc';
import nft from './routes/nft';

export class MatchmakingPool {
  state: any;
  players: Map<string, any>;
  constructor(state: any) {
    this.state = state;
    this.players = new Map();
  }
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/join') {
      const { playerId, profile } = await request.json();
      this.players.set(playerId, { ...profile, joinedAt: Date.now() });
      if (this.players.size >= 2) {
        const pool = Array.from(this.players.values());
        return new Response(JSON.stringify({ status: 'match_found', players: pool.slice(0, 10), poolSize: this.players.size }), { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ status: 'waiting', poolSize: this.players.size }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/leave') {
      const { playerId } = await request.json();
      this.players.delete(playerId);
      return new Response(JSON.stringify({ status: 'left' }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ poolSize: this.players.size }), { headers: { 'Content-Type': 'application/json' } });
  }
}

export class VoiceRoom {
  state: any;
  participants: Map<string, any>;
  constructor(state: any) {
    this.state = state;
    this.participants = new Map();
  }
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/join') {
      const { userId, offer } = await request.json();
      this.participants.set(userId, { offer, joinedAt: Date.now() });
      const others = Array.from(this.participants.entries()).filter(([id]) => id !== userId).map(([id, data]) => ({ userId: id, offer: data.offer }));
      return new Response(JSON.stringify({ participants: others }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname === '/signal') {
      const { targetUserId, signal } = await request.json();
      await this.state.storage.put(`signal:${targetUserId}`, signal);
      return new Response(JSON.stringify({ forwarded: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ count: this.participants.size }), { headers: { 'Content-Type': 'application/json' } });
  }
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: ['http://localhost:3000', 'https://nexorum.app', '*'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true }));
app.use('*', logger());
app.use('*', prettyJSON());

app.get('/', (c) => c.json({ name: 'NEXORUM API', version: '1.0.0', status: 'operational', features: ['auth', 'profiles', 'wallet', 'markets', 'matchmaking', 'guilds', 'parties', 'leaderboard', 'ai', 'voice', 'nft'] }));

app.route('/auth', auth);
app.route('/profiles', profiles);
app.route('/wallet', wallet);
app.route('/markets', markets);
app.route('/matchmaking', matchmaking);
app.route('/guilds', guilds);
app.route('/parties', parties);
app.route('/leaderboard', leaderboard);
app.route('/ai', ai);
app.route('/voice', voice);
app.route('/nft', nft);

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Internal server error', message: (err as Error).message }, 500);
});

export default app;
