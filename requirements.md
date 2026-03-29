# Expense Tracker — Requirements

## Vision
A best-in-class, multi-user expense tracker for Indian users. Covers all transaction types (UPI, credit card, net banking, cash, multi-currency). Zero-cost integrations. Smart categorization powered by a locally-stored pattern index seeded by Claude API. Cloud-synced, responsive PWA usable on any device via URL.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite (PWA) | Responsive on web + mobile via URL; installable |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible, consistent |
| Charts | Recharts | Composable, lightweight |
| CSV Parsing | Papa Parse | Client-side, no server needed |
| Backend + DB | Supabase | Free tier: PostgreSQL + Auth + Realtime + Edge Functions |
| Hosting | Vercel | Free tier, optimal for Vite/React |
| AI Categorization | Claude API (Anthropic) | Batched monthly, not per-transaction |
| Currency Rates | ExchangeRate-API | Free tier: 1500 req/month |
| SMS Access (future) | Capacitor | Wraps PWA as Android APK for READ_SMS |

---

## Phased Scope

### Phase 1 — Core (Build First)
- Authentication (multi-user)
- Manual transaction entry
- CSV import (major Indian banks)
- Pattern Index categorization system (Claude API, batched)
- Basic analytics & reports
- Multi-currency support

### Phase 2 — Enhanced
- Budgets & real-time alerts
- Split expenses + full settlement tracking
- Recurring transaction detection & management

### Phase 3 — Integrations
- Gmail API parsing (OAuth, free)
- SMS parsing via Capacitor (Android APK wrapper)
- PDF statement parsing

---

## Feature Specifications

### 1. Authentication
- Provider: Supabase Auth
- Methods: Email/password + Google OAuth
- Every user has their own isolated data (row-level security)
- Optional: invite-based groups for split expense sharing

---

### 2. Transaction Management

#### Manual Entry
Fields:
- Date (required)
- Amount (required)
- Currency (default: INR)
- Type: Debit / Credit
- Payment method: UPI | Credit Card | Debit Card | Net Banking | Cash | Other
- Merchant / Payee name (free text)
- Category (auto-filled from pattern index, overridable)
- Sub-category
- Note (optional)
- Tags (optional, freeform)
- Split flag (optional, links to a split group)
- Recurring flag (optional)

#### CSV Import
- Supported banks (Phase 1): HDFC, SBI, ICICI, Axis, Kotak
- Per-bank column parser (date format, debit/credit columns, narration field)
- Preview before import (show parsed rows, flag parse failures)
- Duplicate detection (same date + amount + narration → warn user)
- Auto-run categorization on import using pattern index

#### Data Model (core tables)
```
users             — id, email, name, created_at
transactions      — id, user_id, date, amount, currency, type, method,
                    merchant, raw_narration, category_id, subcategory_id,
                    note, tags[], is_recurring, created_at
categories        — id, name, parent_id (for sub-categories), icon, color
pattern_index     — id, pattern (regex/glob), brand, entity_type, purpose,
                    category_id, confidence, source (claude|user), updated_at
split_groups      — id, name, created_by, members[], created_at
split_expenses    — id, group_id, transaction_id, total_amount, currency,
                    paid_by, splits (JSONB: [{user_id, amount, settled}]),
                    created_at
settlements       — id, group_id, from_user, to_user, amount, currency,
                    settled_at
exchange_rates    — currency_pair, rate, fetched_at
```

---

### 3. Pattern Index & Categorization System

#### Concept
A persistent lookup table that maps raw UPI/bank narration strings to structured categories. Built once by Claude, reused forever.

#### How It Works
1. **On new data import:** Extract all unique raw narration strings not already matched by the index
2. **Batch to Claude API:** Single call with all unknown patterns → Claude returns structured mappings
3. **Store in `pattern_index`:** Each entry has a regex/glob pattern, brand, entity_type, purpose, category
4. **All future lookups:** Pure local regex matching — no API call
5. **User corrections:** If a user recategorizes a transaction, it updates the matching pattern index entry (source = "user", overrides Claude)
6. **Scheduled refresh:** Monthly batch for any accumulated unmatched patterns

#### Category Taxonomy (v1)

**By Purpose (top-level):**
Food & Dining | Shopping | Transport | Entertainment | Health | Education | Utilities | Travel | Finance | Income | Transfer | Other

**By Entity Type:**
Individual | Food Delivery | E-commerce | Grocery | Pharmacy | Fuel | Streaming | Telecom | Bank | Wallet | Government | Restaurant | Cafe | Subscription

**By Brand:**
Zomato, Swiggy, Amazon, Flipkart, Ola, Uber, Netflix, Spotify, Airtel, Jio, BigBasket, Blinkit, Zepto, PhonePe (wallet), Paytm (wallet), IRCTC, MakeMyTrip, BookMyShow, etc. (index grows over time)

---

### 4. Analytics & Reports

#### Views
- **Dashboard:** Net spend this month, top categories, recent transactions, budget status (Phase 2)
- **Timeline:** Spending over time (day / week / month / year), zoomable
- **Category Drill-down:** Click a category → see all transactions in it → click a merchant → see merchant history
- **Merchant View:** All transactions per merchant, frequency, avg spend
- **Income vs Expense:** Monthly P&L summary
- **Payment Method Breakdown:** UPI vs CC vs Cash etc.

#### Filters (always available globally)
- Date range (presets: this week, this month, last 3M, last 6M, YTD, custom)
- Category / subcategory
- Payment method
- Currency
- Amount range
- Tags
- Account/source (once multiple sources added)

#### Export
- Filtered view → CSV export
- (Phase 2) PDF report

---

### 5. Multi-Currency
- All amounts stored in original currency + INR equivalent at time of transaction
- Exchange rate fetched once daily (ExchangeRate-API free tier)
- Analytics always shown in INR by default with original currency visible
- User can override exchange rate for a specific transaction

---

### 6. Split Expenses & Settlement Tracking (Phase 2)

- Create a split group (e.g., "Goa Trip", "Flat expenses")
- Add members (existing app users by email)
- Mark any transaction as a split expense → assign shares (equal or custom)
- App calculates net balance per member
- Simplified debt algorithm (minimize number of settlements)
- Record settlement when paid → marks as settled
- Settlement history per group

---

### 7. Recurring Transactions (Phase 2)
- Auto-detect recurring patterns (same merchant, similar amount, regular interval)
- User confirms / sets up recurring rule
- Dashboard widget: "Upcoming this month" list
- Alert if expected recurring transaction hasn't arrived

---

### 8. Budgets & Alerts (Phase 2)
- Set monthly budget per category
- Alert at 80% and 100% of budget (in-app notification)
- PWA push notifications (optional, user opt-in)
- Budget vs actual chart per category

---

## Indian Bank CSV Parser Specs (Phase 1)

| Bank | Date Format | Columns |
|---|---|---|
| HDFC | DD/MM/YY | Date, Narration, Value Date, Debit, Credit, Closing Balance |
| SBI | dd MMM yyyy | Txn Date, Value Date, Description, Ref No, Debit, Credit, Balance |
| ICICI | DD/MM/YYYY | Transaction Date, Value Date, Transaction Remarks, Cheque Number, Withdrawal, Deposit, Balance |
| Axis | DD-MM-YYYY | Tran Date, Particulars, Chq/Ref No, Value Date, Withdrawal, Deposit, Balance |
| Kotak | DD-MM-YYYY | Transaction Date, Particulars, Cheque/Ref No., Withdrawal, Deposit, Balance |

---

## Non-Goals (explicitly out of scope)
- Crypto tracking
- Investment/portfolio tracking
- Automated bank sync (AA framework requires regulated entity + paid)
- PhonePe/GPay/PayTM API sync (no personal data API exists)
- Desktop app / Electron wrapper

---

## Future Considerations (not committed)
- Gmail API OAuth integration (parse transaction alert emails)
- Android APK via Capacitor (enables READ_SMS for real-time UPI tracking)
- PDF statement parsing (OCR-based)
- Expense OCR from receipt photos
