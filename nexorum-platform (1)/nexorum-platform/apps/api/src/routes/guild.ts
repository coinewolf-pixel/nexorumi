// =====================================================
// GUILD ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';

const guilds = new Hono<{ Bindings: Env }>();

guilds.use('*', authMiddleware);

// List guilds
guilds.get('/', async (c) => {
  const sb = getSupabase(c.env);
  const { data, error } = await sb
    .from('guilds')
    .select('*, leader:profiles!leader_id(username, avatar_url), member_count:guild_members(count)')
    .order('level', { ascending: false })
    .limit(50);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Get guild details
guilds.get('/:id', async (c) => {
  const id = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('guilds')
    .select('*, members:guild_members(*, user:profiles(username, avatar_url, platform_level)), leader:profiles!leader_id(username, avatar_url)')
    .eq('id', id)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

// Create guild
guilds.post('/', async (c) => {
  const user = getUser(c);
  const { name, tag, description, emblemUrl } = await c.req.json();
  const sb = getSupabase(c.env);

  // Check if user is already in a guild
  const { data: existing } = await sb
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .single();

  if (existing) return c.json({ error: 'Already in a guild' }, 400);

  const { data, error } = await sb
    .from('guilds')
    .insert({
      name,
      tag,
      description,
      emblem_url: emblemUrl,
      leader_id: user.id,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // Add leader as member
  await sb.from('guild_members').insert({
    guild_id: data.id,
    user_id: user.id,
    role: 'leader',
  });

  return c.json(data);
});

// Join guild
guilds.post('/:id/join', async (c) => {
  const user = getUser(c);
  const guildId = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data: guild } = await sb
    .from('guilds')
    .select('max_members, member_count:guild_members(count)')
    .eq('id', guildId)
    .single();

  if (!guild) return c.json({ error: 'Guild not found' }, 404);
  if ((guild.member_count as any)?.[0]?.count >= guild.max_members) {
    return c.json({ error: 'Guild is full' }, 400);
  }

  const { data, error } = await sb
    .from('guild_members')
    .insert({ guild_id: guildId, user_id: user.id })
    .select();

  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// Leave guild
guilds.post('/:id/leave', async (c) => {
  const user = getUser(c);
  const guildId = c.req.param('id');
  const sb = getSupabase(c.env);

  await sb.from('guild_members')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', user.id);

  return c.json({ message: 'Left guild' });
});

// Donate to guild treasury
guilds.post('/:id/donate', async (c) => {
  const user = getUser(c);
  const guildId = c.req.param('id');
  const { amount } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data: wallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.nexo_balance < amount) {
    return c.json({ error: 'Insufficient balance' }, 400);
  }

  const { data: guild } = await sb
    .from('guilds')
    .select('treasury_nexo')
    .eq('id', guildId)
    .single();

  await sb.from('wallets')
    .update({ nexo_balance: wallet.nexo_balance - amount })
    .eq('user_id', user.id);

  await sb.from('guilds')
    .update({ treasury_nexo: (guild?.treasury_nexo || 0) + amount })
    .eq('id', guildId);

  await sb.from('guild_members')
    .update({ contribution_points: sb.rpc('increment', { x: amount }) })
    .eq('guild_id', guildId)
    .eq('user_id', user.id);

  return c.json({ message: 'Donation successful', amount });
});

export default guilds;
