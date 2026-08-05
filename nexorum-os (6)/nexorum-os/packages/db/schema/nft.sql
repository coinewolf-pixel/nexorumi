-- NEXORUM NFT Schema (for tradeable items)

CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id TEXT UNIQUE,
  item_id UUID REFERENCES items(id),
  owner_id UUID REFERENCES profiles(id),
  contract_address TEXT,
  chain TEXT DEFAULT 'polygon',
  metadata_uri TEXT,
  minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nft_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_id UUID NOT NULL REFERENCES nfts(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  price_token TEXT NOT NULL DEFAULT 'nexo',
  price_amount BIGINT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nft_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES nft_listings(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  offer_amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
