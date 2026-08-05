// =====================================================
// PARTY ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';

const parties = new Hono<{ Bindings: Env }>();

parties.use('*', authMiddleware);

// Get my party
parties.get('/me', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data } = await sb
    .from('party_members')
    .select('party:parties(*, members:party_members(*, user:profiles(username, avatar_url, status)))')
    .eq('user_id', user.id)
    .single();

  return c.json(data?.party || null);
});

// Create party
parties.post('/', async (c) => {
  const user = getUser(c);
  const { name, maxMembers = 5, targetMarket } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('parties')
    .insert({
      name,
      leader_id: user.id,
      max_members: maxMembers,
      target_market: targetMarket,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  await sb.from('party_members').insert({
    party_id: data.id,
    user_id: user.id,
    role: 'leader',
  });

  return c.json(data);
});

// Join party
parties.post('/:id/join', async (c) => {
  const user = getUser(c);
  const partyId = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data: party } = await sb
    .from('parties')
    .select('max_members, status, member_count:party_members(count)')
    .eq('id', partyId)
    .single();

  if (!party) return c.json({ error: 'Party not found' }, 404);
  if (party.status === 'full') return c.json({ error: 'Party is full' }, 400);
  if ((party.member_count as any)?.[0]?.count >= party.max_members) {
    return c.json({ error: 'Party is full' }, 400);
  }

  const { data, error } = await sb
    .from('party_members')
    .insert({ party_id: partyId, user_id: user.id })
    .select();

  if (error) return c.json({ error: error.message }, 400);

  // Update party status if full
  if ((party.member_count as any)?.[0]?.count + 1 >= party.max_members) {
    await sb.from('parties').update({ status: 'full' }).eq('id', partyId);
  }

  return c.json(data);
});

// Leave party
parties.post('/:id/leave', async (c) => {
  const user = getUser(c);
  const partyId = c.req.param('id');
  const sb = getSupabase(c.env);

  await sb.from('party_members')
    .delete()
    .eq('party_id', partyId)
    .eq('user_id', user.id);

  // If leader leaves, disband or transfer
  const { data: party } = await sb
    .from('parties')
    .select('leader_id')
    .eq('id', partyId)
    .single();

  if (party?.leader_id === user.id) {
    const { data: nextLeader } = await sb
      .from('party_members')
      .select('user_id')
      .eq('party_id', partyId)
      .order('joined_at', { ascending: true })
      .limit(1)
      .single();

    if (nextLeader) {
      await sb.from('parties')
        .update({ leader_id: nextLeader.user_id })
        .eq('id', partyId);
    } else {
      await sb.from('parties').update({ status: 'disbanded' }).eq('id', partyId);
    }
  }

  return c.json({ message: 'Left party' });
});

// Start voice channel
parties.post('/:id/voice', async (c) => {
  const user = getUser(c);
  const partyId = c.req.param('id');
  const sb = getSupabase(c.env);

  const roomId = `party-${partyId}-${Date.now()}`;

  await sb.from('parties')
    .update({ voice_channel_id: roomId })
    .eq('id', partyId);

  return c.json({ roomId, message: 'Voice channel created' });
});

export default parties;
