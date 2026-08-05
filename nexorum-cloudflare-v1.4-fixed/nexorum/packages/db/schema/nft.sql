-- NFT Marketplace tables

CREATE TABLE nft_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  buyer_id UUID REFERENCES profiles(id),
  item_id UUID NOT NULL REFERENCES items(id),
  token_id TEXT,
  price DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ETH',
  market_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_nft_listings_status ON nft_listings(status, market_id);
CREATE INDEX idx_nft_listings_price ON nft_listings(status, price);
CREATE INDEX idx_nft_listings_seller ON nft_listings(seller_id, status);
