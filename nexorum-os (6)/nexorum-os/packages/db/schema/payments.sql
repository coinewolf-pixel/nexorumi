-- NEXORUM Payments Schema (NOWPayments integration)

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  payment_id TEXT NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL,
  token_amount BIGINT NOT NULL,
  price_amount DECIMAL(18,8) NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  pay_currency TEXT NOT NULL,
  pay_address TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
