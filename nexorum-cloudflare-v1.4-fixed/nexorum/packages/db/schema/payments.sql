-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  payment_id TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL,
  token_amount DECIMAL(20, 8) NOT NULL,
  price_amount DECIMAL(20, 8) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  pay_currency TEXT NOT NULL,
  pay_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'confirming', 'confirmed', 'finished', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_order ON payments(order_id);
