// =====================================================
// LEADERBOARD ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';

const leaderboard = new Hono<{ Bindings: Env }>();

// Get leaderboard by market
leaderboard.get('/:marketType', async (c) => {
  const marketType = c.req.param('marketType');
  const season = parseInt(c.req.query('season') || '1');
  const limit = parseInt(c.req.query('limit') || '100');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('leaderboard_entries')
    .select('*, user:profiles(username, avatar_url, platform_level)')
    .eq('market_type', marketType)
    .eq('season', season)
    .order('elo', { ascending: false })
    .limit(limit);

  if (error) return c.json({ error: error.message }, 500);

  // Add rank positions
  const ranked = data?.map((entry: any, index: number) => ({
    ...entry,
    rank_position: index + 1,
  }));

  return c.json(ranked);
});

// Get global ranking
leaderboard.get('/global/top', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('profiles')
    .select('id, username, display_name, avatar_url, platform_level, platform_xp, reputation, status')
    .order('platform_level', { ascending: false })
    .order('platform_xp', { ascending: false })
    .limit(limit);

  if (error) return c.json({ error: error.message }, 500);

  const ranked = data?.map((entry: any, index: number) => ({
    ...entry,
    global_rank: index + 1,
  }));

  return c.json(ranked);
});

// Get player stats
leaderboard.get('/player/:userId', async (c) => {
  const userId = c.req.param('userId');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('leaderboard_entries')
    .select('*, user:profiles(username, avatar_url)')
    .eq('user_id', userId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

export default leaderboard;
