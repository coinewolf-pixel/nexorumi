import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { MatchRoom } from './durable-objects/MatchRoom';
import paymentRoutes from './payments/routes';

export { MatchRoom };

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  NEXORUM_CACHE: KVNamespace;
  NEXORUM_DB: D1Database;
  MATCH_ROOM: DurableObjectNamespace;
  NOWPAYMENTS_API_KEY: string;
  NOWPAYMENTS_IPN_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: ['https://nexorum-web.pages.dev', 'https://nexorum-admin.pages.dev', 'http://localhost:3000'], credentials: true }));
app.use('*', logger());
app.use('*', prettyJSON());

app.use('*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const key = `rate:${ip}`;
  const now = Date.now();
  const data = await c.env.NEXORUM_CACHE.get(key);
  let record = data ? JSON.parse(data) : { count: 0, resetAt: now + 60000 };
  if (now > record.resetAt) record = { count: 0, resetAt: now + 60000 };
  record.count++;
  await c.env.NEXORUM_CACHE.put(key, JSON.stringify(record), { expirationTtl: 60 });
  if (record.count > 100) return c.json({ error: 'Rate limit exceeded' }, 429);
  await next();
});

function getSupabase(c: any, service = false) {
  return createClient(c.env.SUPABASE_URL, service ? c.env.SUPABASE_SERVICE_KEY : c.env.SUPABASE_ANON_KEY);
}

app.get('/', (c) => c.json({ ok: true, service: 'nexorum-api', version: '1.2.0', timestamp: new Date().toISOString() }));
app.get('/health', (c) => c.json({ status: 'healthy', edge: c.req.raw.cf?.colo || 'unknown' }));

app.post('/auth/register', async (c) => {
  const { email, password, username } = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return c.json({ error: authError.message }, 400);
  const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user!.id, username, email });
  if (profileError) return c.json({ error: profileError.message }, 400);
  return c.json({ user: authData.user, message: 'Registration successful' });
});

app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return c.json({ error: error.message }, 401);
  return c.json({ session: data.session, user: data.user });
});

app.get('/profile/:id', async (c) => {
  const id = c.req.param('id');
  const cacheKey = `profile:${id}`;
  const cached = await c.env.NEXORUM_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return c.json({ error: error.message }, 404);
  await c.env.NEXORUM_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 });
  return c.json(data);
});

app.patch('/profile/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data, error } = await supabase.from('profiles').update(body).eq('id', id).select().single();
  if (error) return c.json({ error: error.message }, 400);
  await c.env.NEXORUM_CACHE.delete(`profile:${id}`);
  return c.json(data);
});

app.get('/wallet/:userId', async (c) => {
  const userId = c.req.param('userId');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId);
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.get('/markets', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('markets').select('*');
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/markets/:id/state', async (c) => {
  const id = c.req.param('id');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('markets').select('*').eq('id', id).single();
  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

app.get('/leaderboard/:marketId', async (c) => {
  const marketId = c.req.param('marketId');
  const season = c.req.query('season') || 'current';
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  const cacheKey = `lb:${marketId}:${season}:${limit}:${offset}`;
  const cached = await c.env.NEXORUM_CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('leaderboard_entries').select('*, profiles(username, avatar_url)').eq('market_id', marketId).eq('season_id', season).order('rank', { ascending: true }).range(offset, offset + limit - 1);
  if (error) return c.json({ error: error.message }, 500);
  await c.env.NEXORUM_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
  return c.json(data);
});

app.get('/inventory/:userId', async (c) => {
  const userId = c.req.param('userId');
  const marketId = c.req.query('market');
  const supabase = getSupabase(c);
  let query = supabase.from('inventory').select('*, items(*)').eq('user_id', userId);
  if (marketId) query = query.eq('market_source', marketId);
  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post('/trades', async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data, error } = await supabase.from('trades').insert({ ...body, status: 'pending', expires_at: new Date(Date.now() + 3600000).toISOString() }).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.patch('/trades/:id', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data, error } = await supabase.from('trades').update({ status }).eq('id', id).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.get('/guilds', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('guilds').select('*').eq('is_recruiting', true).limit(50);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post('/guilds', async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data, error } = await supabase.from('guilds').insert(body).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.get('/economy/metrics', async (c) => {
  const supabase = getSupabase(c);
  const [{ data: wallets }, { data: staked }, { data: burned }] = await Promise.all([
    supabase.from('wallets').select('balance').eq('token_type', 'nexo'),
    supabase.from('staking_positions').select('amount').eq('status', 'active'),
    supabase.from('transactions').select('amount').eq('type', 'burn'),
  ]);
  const circulating = wallets?.reduce((a, w) => a + (w.balance || 0), 0) || 0;
  const stakedTotal = staked?.reduce((a, s) => a + (s.amount || 0), 0) || 0;
  const burnedTotal = burned?.reduce((a, b) => a + Math.abs(b.amount || 0), 0) || 0;
  return c.json({ totalSupply: 1_000_000_000, circulating, staked: stakedTotal, burned: burnedTotal, activeStakers: staked?.length || 0 });
});

app.get('/matchmaking/queue', async (c) => {
  const marketId = c.req.query('market') || 'hunt';
  const mode = c.req.query('mode') || 'solo';
  const userId = c.req.query('userId');
  const username = c.req.query('username') || 'Player';
  const elo = parseInt(c.req.query('elo') || '1000');
  const latency = parseInt(c.req.query('latency') || '50');
  const region = c.req.query('region') || 'us-east';

  if (!userId) return c.json({ error: 'userId required' }, 400);

  const skillBracket = Math.floor(elo / 200);
  const roomId = `${marketId}:${mode}:bracket${skillBracket}`;
  const id = c.env.MATCH_ROOM.idFromName(roomId);
  const room = c.env.MATCH_ROOM.get(id);

  const wsUrl = `${c.req.url.replace('http', 'ws').split('/matchmaking')[0]}/matchmaking/room/${roomId}/websocket?userId=${userId}&username=${encodeURIComponent(username)}&elo=${elo}&latency=${latency}&region=${region}&market=${marketId}&mode=${mode}`;

  return c.json({ matchRoomId: roomId, websocketUrl: wsUrl, durableObjectId: id.toString() });
});

app.get('/matchmaking/room/:roomId/websocket', async (c) => {
  const roomId = c.req.param('roomId');
  const id = c.env.MATCH_ROOM.idFromName(roomId);
  const room = c.env.MATCH_ROOM.get(id);
  const request = new Request(c.req.url, { headers: c.req.raw.headers, method: c.req.method });
  return room.fetch(request);
});

app.get('/matchmaking/room/:roomId/state', async (c) => {
  const roomId = c.req.param('roomId');
  const id = c.env.MATCH_ROOM.idFromName(roomId);
  const room = c.env.MATCH_ROOM.get(id);
  const request = new Request(`${c.req.url.split('/state')[0]}/state`, { headers: c.req.raw.headers, method: 'GET' });
  return room.fetch(request);
});

app.route('/payments', paymentRoutes);

app.get('/admin/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search') || '';
  const supabase = getSupabase(c, true);
  let query = supabase.from('profiles').select('*', { count: 'exact' });
  if (search) query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data, count, page, limit });
});

app.patch('/admin/users/:id/ban', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data, error } = await supabase.from('profiles').update({ status }).eq('id', id).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

app.get('/admin/reports', async (c) => {
  const status = c.req.query('status');
  const supabase = getSupabase(c, true);
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query.limit(100);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.patch('/admin/reports/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data, error } = await supabase.from('reports').update({ ...body, resolved_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

export default app;
