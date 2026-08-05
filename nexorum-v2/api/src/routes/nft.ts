// =====================================================
// NFT MARKETPLACE ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';

const nft = new Hono<{ Bindings: Env }>();

// Public: Get NFT items
nft.get('/items', async (c) => {
  const sb = getSupabase(c.env);
  const { data, error } = await sb
    .from('items')
    .select('*')
    .eq('is_nft', true)
    .eq('is_tradable', true)
    .order('base_price', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// Public: Get NFT details
nft.get('/items/:id', async (c) => {
  const id = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('items')
    .select('*, trades(*, seller:profiles!seller_id(username))')
    .eq('id', id)
    .eq('is_nft', true)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

nft.use('*', authMiddleware);

// Mint NFT (admin only in production)
nft.post('/mint', async (c) => {
  const user = getUser(c);
  const { name, description, category, rarity, marketType, imageUrl, metadata, price } = await c.req.json();
  const sb = getSupabase(c.env);

  // Generate NFT contract data
  const tokenId = `NEXO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data, error } = await sb
    .from('items')
    .insert({
      name,
      description,
      category,
      rarity,
      market_type: marketType,
      image_url: imageUrl,
      metadata: {
        ...metadata,
        creator: user.id,
        minted_at: new Date().toISOString(),
        token_id: tokenId,
      },
      base_price: price,
      is_nft: true,
      is_tradable: true,
      max_supply: 1,
      current_supply: 1,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // Add to creator's inventory
  await sb.from('inventory').insert({
    user_id: user.id,
    item_id: data.id,
    quantity: 1,
    metadata: { minted: true },
  });

  return c.json({ nft: data, tokenId, message: 'NFT minted successfully' });
});

// List NFT for sale
nft.post('/list', async (c) => {
  const user = getUser(c);
  const { itemId, priceNexo, marketType = 'global' } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data: item } = await sb
    .from('inventory')
    .select('*, item:items(*)')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .single();

  if (!item || !item.item.is_nft) {
    return c.json({ error: 'NFT not found in inventory' }, 404);
  }

  const { data: trade, error } = await sb
    .from('trades')
    .insert({
      seller_id: user.id,
      item_id: itemId,
      quantity: 1,
      price_nexo: priceNexo,
      market_type: marketType,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(trade);
});

// Buy NFT
nft.post('/buy/:tradeId', async (c) => {
  const user = getUser(c);
  const tradeId = c.req.param('tradeId');
  const sb = getSupabase(c.env);

  const { data: trade } = await sb
    .from('trades')
    .select('*, item:items(*)')
    .eq('id', tradeId)
    .eq('status', 'active')
    .single();

  if (!trade) return c.json({ error: 'Trade not found' }, 404);
  if (!trade.item.is_nft) return c.json({ error: 'Not an NFT trade' }, 400);

  // Check balance
  const { data: wallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.nexo_balance < trade.price_nexo) {
    return c.json({ error: 'Insufficient NEXO' }, 400);
  }

  // Transfer ownership
  await sb.from('wallets')
    .update({ nexo_balance: wallet.nexo_balance - trade.price_nexo })
    .eq('user_id', user.id);

  const { data: sellerWallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', trade.seller_id)
    .single();

  await sb.from('wallets')
    .update({ nexo_balance: (sellerWallet?.nexo_balance || 0) + trade.price_nexo })
    .eq('user_id', trade.seller_id);

  // Transfer NFT inventory
  await sb.from('inventory')
    .delete()
    .eq('user_id', trade.seller_id)
    .eq('item_id', trade.item_id);

  await sb.from('inventory').insert({
    user_id: user.id,
    item_id: trade.item_id,
    quantity: 1,
    metadata: { purchased_at: new Date().toISOString(), previous_owner: trade.seller_id },
  });

  // Update trade
  await sb.from('trades')
    .update({ status: 'completed', buyer_id: user.id })
    .eq('id', tradeId);

  return c.json({ message: 'NFT purchased', nft: trade.item });
});

// Get my NFTs
nft.get('/my', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('inventory')
    .select('*, item:items(*)')
    .eq('user_id', user.id)
    .eq('item.is_nft', true);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

export default nft;
