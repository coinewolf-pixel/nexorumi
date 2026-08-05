// =====================================================
// PROFILE ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';

const profiles = new Hono<{ Bindings: Env }>();

profiles.use('*', authMiddleware);

// Get my profile
profiles.get('/me', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('profiles')
    .select('*, wallets(*)')
    .eq('id', user.id)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Get profile by username
profiles.get('/:username', async (c) => {
  const username = c.req.param('username');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('profiles')
    .select('*, wallets(nexo_balance, nexo_staked)')
    .eq('username', username)
    .single();

  if (error) return c.json({ error: 'Profile not found' }, 404);
  return c.json(data);
});

// Update profile
profiles.patch('/me', async (c) => {
  const user = getUser(c);
  const updates = await c.req.json();
  const sb = getSupabase(c.env);

  const allowedFields = ['display_name', 'avatar_url', 'bio', 'country', 'language', 'status'];
  const filteredUpdates: Record<string, any> = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  const { data, error } = await sb
    .from('profiles')
    .update(filteredUpdates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Search profiles
profiles.get('/search/:query', async (c) => {
  const query = c.req.param('query');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('profiles')
    .select('id, username, display_name, avatar_url, platform_level, reputation, status')
    .ilike('username', `%${query}%`)
    .limit(20);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Get friends
profiles.get('/me/friends', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('friendships')
    .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted');

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Send friend request
profiles.post('/me/friends', async (c) => {
  const user = getUser(c);
  const { userId } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: userId,
      status: 'pending'
    })
    .select();

  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// Accept friend request
profiles.patch('/me/friends/:id/accept', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', id)
    .eq('addressee_id', user.id)
    .select();

  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

export default profiles;
