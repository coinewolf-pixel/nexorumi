// apps/api/src/nft/routes.ts
// NEXORUM NFT Marketplace API

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  NEXORUM_CACHE: KVNamespace;
  NFT_CONTRACT_ADDRESS: string;
  RPC_URL: string;
}

const nft = new Hono<{ Bindings: Env }>();

function getSupabase(c: any) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
}

// ─── Listings ──────────────────────────────────────────────────────

nft.get('/listings', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('nft_listings')
    .select('*, items(*)')
    .eq('status', 'active')
    .order('price', { ascending: true })
    .limit(50);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

nft.get('/listings/:marketId', async (c) => {
  const marketId = c.req.param('marketId');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('nft_listings')
    .select('*, items(*)')
    .eq('status', 'active')
    .eq('market_id', marketId)
    .order('price', { ascending: true })
    .limit(50);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

nft.get('/listings/item/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('nft_listings')
    .select('*')
    .eq('item_id', itemId)
    .eq('status', 'active')
    .single();
  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

// ─── Create Listing ────────────────────────────────────────────────

nft.post('/list', async (c) => {
  const { userId, itemId, tokenId, price, currency = 'ETH' } = await c.req.json();
  const supabase = getSupabase(c);

  // Verify ownership
  const { data: inventory } = await supabase.from('inventory')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();

  if (!inventory) return c.json({ error: 'Item not found in inventory' }, 404);
  if (inventory.is_bound) return c.json({ error: 'Bound items cannot be listed' }, 400);

  const { data, error } = await supabase.from('nft_listings').insert({
    seller_id: userId,
    item_id: itemId,
    token_id: tokenId,
    price,
    currency,
    status: 'active',
    created_at: new Date().toISOString(),
  }).select().single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

// ─── Buy Item ──────────────────────────────────────────────────────

nft.post('/buy/:listingId', async (c) => {
  const listingId = c.req.param('listingId');
  const { buyerId, txHash } = await c.req.json();
  const supabase = getSupabase(c);

  const { data: listing } = await supabase.from('nft_listings')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();

  if (!listing) return c.json({ error: 'Listing not found or inactive' }, 404);
  if (listing.seller_id === buyerId) return c.json({ error: 'Cannot buy your own item' }, 400);

  // Update listing
  await supabase.from('nft_listings').update({
    status: 'sold',
    buyer_id: buyerId,
    sold_at: new Date().toISOString(),
    tx_hash: txHash,
  }).eq('id', listingId);

  // Transfer inventory
  await supabase.from('inventory').update({
    user_id: buyerId,
    is_bound: false,
  }).eq('item_id', listing.item_id).eq('user_id', listing.seller_id);

  // Log transaction
  await supabase.from('transactions').insert({
    user_id: buyerId,
    type: 'trade',
    token_type: 'eth',
    amount: -listing.price,
    metadata: { listing_id: listingId, item_id: listing.item_id, tx_hash: txHash },
  });

  return c.json({ success: true, message: 'Purchase completed' });
});

// ─── Delist ────────────────────────────────────────────────────────

nft.post('/delist/:listingId', async (c) => {
  const listingId = c.req.param('listingId');
  const { userId } = await c.req.json();
  const supabase = getSupabase(c);

  const { data: listing } = await supabase.from('nft_listings')
    .select('*')
    .eq('id', listingId)
    .eq('seller_id', userId)
    .single();

  if (!listing) return c.json({ error: 'Listing not found' }, 404);

  await supabase.from('nft_listings').update({ status: 'cancelled' }).eq('id', listingId);
  return c.json({ success: true });
});

// ─── My NFTs ───────────────────────────────────────────────────────

nft.get('/my/:userId', async (c) => {
  const userId = c.req.param('userId');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('inventory')
    .select('*, items(*)')
    .eq('user_id', userId)
    .eq('items.is_nft', true);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// ─── Floor Prices ──────────────────────────────────────────────────

nft.get('/floor/:marketId', async (c) => {
  const marketId = c.req.param('marketId');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('nft_listings')
    .select('price')
    .eq('status', 'active')
    .eq('market_id', marketId)
    .order('price', { ascending: true })
    .limit(1)
    .single();
  if (error) return c.json({ floor: 0 });
  return c.json({ floor: data.price });
});

// ─── Recent Sales ──────────────────────────────────────────────────

nft.get('/sales/recent', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('nft_listings')
    .select('*, items(name, rarity), seller:profiles!nft_listings_seller_id_fkey(username), buyer:profiles!nft_listings_buyer_id_fkey(username)')
    .eq('status', 'sold')
    .order('sold_at', { ascending: false })
    .limit(20);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

export default nft;
