-- Phase 2: Split Expenses & Settlement Tracking
-- Run this migration when implementing Phase 2 features.

-- ─── Split Groups ─────────────────────────────────────────────────────────────
CREATE TABLE split_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  members    UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Split Expenses ───────────────────────────────────────────────────────────
CREATE TABLE split_expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  total_amount   NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
  currency       TEXT NOT NULL DEFAULT 'INR',
  paid_by        UUID NOT NULL REFERENCES auth.users(id),
  -- JSONB array: [{user_id: uuid, amount: numeric, settled: boolean}]
  splits         JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Settlements ──────────────────────────────────────────────────────────────
CREATE TABLE settlements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES split_groups(id) ON DELETE CASCADE,
  from_user  UUID NOT NULL REFERENCES auth.users(id),
  to_user    UUID NOT NULL REFERENCES auth.users(id),
  amount     NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency   TEXT NOT NULL DEFAULT 'INR',
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FK: transactions.split_group_id ─────────────────────────────────────────
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_split_group
  FOREIGN KEY (split_group_id) REFERENCES split_groups(id) ON DELETE SET NULL;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_split_groups_created_by  ON split_groups (created_by);
CREATE INDEX idx_split_expenses_group     ON split_expenses (group_id);
CREATE INDEX idx_settlements_group        ON settlements (group_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "split_groups_member_access"
  ON split_groups FOR ALL
  USING (
    auth.uid() = created_by OR
    auth.uid() = ANY(members)
  );

ALTER TABLE split_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "split_expenses_group_member"
  ON split_expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM split_groups g
      WHERE g.id = group_id
        AND (auth.uid() = g.created_by OR auth.uid() = ANY(g.members))
    )
  );

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements_group_member"
  ON settlements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM split_groups g
      WHERE g.id = group_id
        AND (auth.uid() = g.created_by OR auth.uid() = ANY(g.members))
    )
  );
