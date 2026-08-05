// =====================================================
// WALLET & NEXO ECONOMY ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';

const wallet = new Hono<{ Bindings: Env }>();

wallet.use('*', authMiddleware);

// Get wallet
wallet.get('/', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Get transactions
wallet.get('/transactions', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);
  const limit = parseInt(c.req.query('limit') || '50');

  const { data, error } = await sb
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Stake NEXO
wallet.post('/stake', async (c) => {
  const user = getUser(c);
  const { amount, lockPeriodDays = 30 } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data: wallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.nexo_balance < amount) {
    return c.json({ error: 'Insufficient balance' }, 400);
  }

  const apy = lockPeriodDays >= 90 ? 18.5 : lockPeriodDays >= 60 ? 15.0 : 12.5;
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + lockPeriodDays);

  // Create staking position
  const { data: stake, error: stakeError } = await sb
    .from('staking_positions')
    .insert({
      user_id: user.id,
      amount,
      apy,
      lock_period_days: lockPeriodDays,
      ends_at: endsAt.toISOString(),
    })
    .select()
    .single();

  if (stakeError) return c.json({ error: stakeError.message }, 500);

  // Deduct from balance
  await sb.from('wallets')
    .update({
      nexo_balance: wallet.nexo_balance - amount,
      nexo_staked: (wallet.nexo_staked || 0) + amount,
    })
    .eq('user_id', user.id);

  // Record transaction
  await sb.from('transactions').insert({
    user_id: user.id,
    type: 'stake',
    amount: -amount,
    reference_id: stake.id,
    reference_type: 'staking_position',
    status: 'completed',
  });

  return c.json({ stake, message: 'Staking successful' });
});

// Claim staking rewards
wallet.post('/stake/:id/claim', async (c) => {
  const user = getUser(c);
  const stakeId = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data: stake } = await sb
    .from('staking_positions')
    .select('*')
    .eq('id', stakeId)
    .eq('user_id', user.id)
    .single();

  if (!stake) return c.json({ error: 'Staking position not found' }, 404);
  if (stake.status !== 'active') return c.json({ error: 'Already claimed' }, 400);

  const daysElapsed = Math.floor((Date.now() - new Date(stake.started_at).getTime()) / (1000 * 60 * 60 * 24));
  const reward = stake.amount * (stake.apy / 100) * (daysElapsed / 365);

  await sb.from('staking_positions')
    .update({ status: 'claimed', rewards_earned: reward })
    .eq('id', stakeId);

  const { data: wallet } = await sb
    .from('wallets')
    .select('nexo_balance, nexo_staked, nexo_earned')
    .eq('user_id', user.id)
    .single();

  await sb.from('wallets')
    .update({
      nexo_balance: (wallet?.nexo_balance || 0) + stake.amount + reward,
      nexo_staked: (wallet?.nexo_staked || 0) - stake.amount,
      nexo_earned: (wallet?.nexo_earned || 0) + reward,
    })
    .eq('user_id', user.id);

  await sb.from('transactions').insert({
    user_id: user.id,
    type: 'unstake',
    amount: stake.amount + reward,
    reference_id: stakeId,
    reference_type: 'staking_position',
    status: 'completed',
  });

  return c.json({ reward, total: stake.amount + reward, message: 'Rewards claimed' });
});

// Transfer NEXO
wallet.post('/transfer', async (c) => {
  const user = getUser(c);
  const { toUserId, amount } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data: fromWallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', user.id)
    .single();

  if (!fromWallet || fromWallet.nexo_balance < amount) {
    return c.json({ error: 'Insufficient balance' }, 400);
  }

  const { data: toWallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', toUserId)
    .single();

  if (!toWallet) return c.json({ error: 'Recipient not found' }, 404);

  // Deduct from sender
  await sb.from('wallets')
    .update({ nexo_balance: fromWallet.nexo_balance - amount })
    .eq('user_id', user.id);

  // Add to receiver
  await sb.from('wallets')
    .update({ nexo_balance: toWallet.nexo_balance + amount })
    .eq('user_id', toUserId);

  // Record transactions
  await sb.from('transactions').insert([
    { user_id: user.id, type: 'transfer', amount: -amount, reference_type: 'user_transfer', status: 'completed' },
    { user_id: toUserId, type: 'transfer', amount, reference_type: 'user_transfer', status: 'completed' },
  ]);

  return c.json({ message: 'Transfer successful', amount });
});

export default wallet;
