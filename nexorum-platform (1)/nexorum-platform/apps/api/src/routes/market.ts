// =====================================================
// MARKET ROUTES (Global + Game Markets)
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';

const markets = new Hono<{ Bindings: Env }>();

// Public: Get all markets
markets.get('/', async (c) => {
  const sb = getSupabase(c.env);
  const { data, error } = await sb.from('markets').select('*').eq('status', 'active');
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Public: Get items by market
markets.get('/:marketType/items', async (c) => {
  const marketType = c.req.param('marketType');
  const sb = getSupabase(c.env);
  const rarity = c.req.query('rarity');
  const category = c.req.query('category');

  let query = sb.from('items').select('*').eq('market_type', marketType);
  if (rarity) query = query.eq('rarity', rarity);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('base_price', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Public: Get active trades
markets.get('/:marketType/trades', async (c) => {
  const marketType = c.req.param('marketType');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('trades')
    .select('*, item:items(*), seller:profiles!seller_id(username, avatar_url)')
    .eq('market_type', marketType)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

markets.use('*', authMiddleware);

// Create trade listing
markets.post('/trades', async (c) => {
  const user = getUser(c);
  const { itemId, quantity, priceNexo, marketType, expiresInHours = 24 } = await c.req.json();
  const sb = getSupabase(c.env);

  // Verify ownership
  const { data: invItem } = await sb
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .single();

  if (!invItem || invItem.quantity < quantity) {
    return c.json({ error: 'Item not in inventory or insufficient quantity' }, 400);
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const { data, error } = await sb
    .from('trades')
    .insert({
      seller_id: user.id,
      item_id: itemId,
      quantity,
      price_nexo: priceNexo,
      market_type: marketType,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // Lock item in inventory
  await sb.from('inventory')
    .update({ quantity: invItem.quantity - quantity })
    .eq('id', invItem.id);

  return c.json(data);
});

// Buy from trade
markets.post('/trades/:id/buy', async (c) => {
  const user = getUser(c);
  const tradeId = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data: trade } = await sb
    .from('trades')
    .select('*, item:items(*)')
    .eq('id', tradeId)
    .eq('status', 'active')
    .single();

  if (!trade) return c.json({ error: 'Trade not found or inactive' }, 404);
  if (trade.seller_id === user.id) return c.json({ error: 'Cannot buy your own listing' }, 400);

  // Check buyer balance
  const { data: buyerWallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', user.id)
    .single();

  if (!buyerWallet || buyerWallet.nexo_balance < trade.price_nexo) {
    return c.json({ error: 'Insufficient NEXO balance' }, 400);
  }

  // Get market fee
  const { data: market } = await sb
    .from('markets')
    .select('trading_fee_percent')
    .eq('type', trade.market_type)
    .single();

  const fee = trade.price_nexo * ((market?.trading_fee_percent || 2.5) / 100);
  const sellerAmount = trade.price_nexo - fee;

  // Transfer NEXO
  await sb.from('wallets')
    .update({ nexo_balance: buyerWallet.nexo_balance - trade.price_nexo })
    .eq('user_id', user.id);

  const { data: sellerWallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', trade.seller_id)
    .single();

  await sb.from('wallets')
    .update({ nexo_balance: (sellerWallet?.nexo_balance || 0) + sellerAmount })
    .eq('user_id', trade.seller_id);

  // Transfer item
  const { data: existingInv } = await sb
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', trade.item_id)
    .single();

  if (existingInv) {
    await sb.from('inventory')
      .update({ quantity: existingInv.quantity + trade.quantity })
      .eq('id', existingInv.id);
  } else {
    await sb.from('inventory').insert({
      user_id: user.id,
      item_id: trade.item_id,
      quantity: trade.quantity,
    });
  }

  // Update trade
  await sb.from('trades')
    .update({ status: 'completed', buyer_id: user.id, completed_at: new Date().toISOString() })
    .eq('id', tradeId);

  // Record transactions
  await sb.from('transactions').insert([
    { user_id: user.id, type: 'purchase', amount: -trade.price_nexo, reference_id: tradeId, reference_type: 'trade', status: 'completed' },
    { user_id: trade.seller_id, type: 'sale', amount: sellerAmount, reference_id: tradeId, reference_type: 'trade', status: 'completed' },
  ]);

  return c.json({ message: 'Purchase successful', trade });
});

// Get my inventory
markets.get('/inventory/me', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('inventory')
    .select('*, item:items(*)')
    .eq('user_id', user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

export default markets;
