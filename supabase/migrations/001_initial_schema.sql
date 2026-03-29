-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon       TEXT,
  color      TEXT,
  is_system  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories (parent_id);

-- ─── Pattern Index ────────────────────────────────────────────────────────────
CREATE TABLE pattern_index (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern     TEXT NOT NULL UNIQUE,   -- regex string, case-insensitive
  brand       TEXT,
  entity_type TEXT,
  purpose     TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  confidence  FLOAT NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  source      TEXT NOT NULL DEFAULT 'claude' CHECK (source IN ('claude', 'user')),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pattern_index_category ON pattern_index (category_id);
CREATE INDEX idx_pattern_index_source   ON pattern_index (source);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  amount          NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'INR',
  amount_inr      NUMERIC(15, 2),
  exchange_rate   NUMERIC(10, 6),
  type            TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  method          TEXT CHECK (method IN ('upi','credit_card','debit_card','net_banking','cash','other')),
  merchant        TEXT,
  raw_narration   TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  note            TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  split_group_id  UUID,  -- FK added in migration 002
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date    ON transactions (user_id, date DESC);
CREATE INDEX idx_transactions_user_type    ON transactions (user_id, type);
CREATE INDEX idx_transactions_category     ON transactions (category_id);
CREATE INDEX idx_transactions_merchant     ON transactions (user_id, merchant);
CREATE INDEX idx_transactions_currency     ON transactions (currency);

-- ─── Exchange Rates ───────────────────────────────────────────────────────────
CREATE TABLE exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair TEXT NOT NULL,        -- e.g. "USD/INR"
  rate          NUMERIC(12, 6) NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exchange_rates_pair_time ON exchange_rates (currency_pair, fetched_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- transactions: users see only their own rows
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- categories: everyone can read system categories; users can read their own custom ones
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_read_all"
  ON categories FOR SELECT
  USING (TRUE);

-- pattern_index: everyone can read all patterns; write only own or system (created_by IS NULL)
ALTER TABLE pattern_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pattern_index_read_all"
  ON pattern_index FOR SELECT
  USING (TRUE);

CREATE POLICY "pattern_index_insert"
  ON pattern_index FOR INSERT
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "pattern_index_update"
  ON pattern_index FOR UPDATE
  USING (created_by = auth.uid() OR created_by IS NULL);

-- exchange_rates: public read, any authenticated user can insert/upsert
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_read"
  ON exchange_rates FOR SELECT
  USING (TRUE);

CREATE POLICY "exchange_rates_insert"
  ON exchange_rates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─── Seed: Default Categories ─────────────────────────────────────────────────
INSERT INTO categories (name, icon, color, is_system) VALUES
  ('Food & Dining',    'utensils',          '#f97316', TRUE),
  ('Shopping',         'shopping-bag',       '#8b5cf6', TRUE),
  ('Transport',        'car',               '#3b82f6', TRUE),
  ('Entertainment',    'tv',                '#ec4899', TRUE),
  ('Health',           'heart-pulse',       '#ef4444', TRUE),
  ('Education',        'graduation-cap',    '#06b6d4', TRUE),
  ('Utilities',        'zap',               '#eab308', TRUE),
  ('Travel',           'plane',             '#14b8a6', TRUE),
  ('Finance',          'landmark',          '#64748b', TRUE),
  ('Income',           'trending-up',       '#22c55e', TRUE),
  ('Transfer',         'arrow-left-right',  '#94a3b8', TRUE),
  ('Other',            'more-horizontal',   '#a1a1aa', TRUE);
