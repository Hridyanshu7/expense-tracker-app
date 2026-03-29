# Technical Specifications

## Architecture Overview

A client-heavy React PWA backed by Supabase. Most business logic (parsing, pattern matching, analytics aggregation) runs client-side. Supabase provides auth, the PostgreSQL database, and row-level security. There is no custom backend server.

```
Browser (React PWA)
    │
    ├── Supabase JS SDK ──► Supabase (Auth + PostgreSQL + RLS)
    ├── Claude API SDK  ──► Anthropic API  (batched categorization only)
    └── ExchangeRate-API ─► exchangerate-api.com (daily rate cache)
```

---

## Frontend

### Stack
- **React 18** with `createRoot`
- **TypeScript** (strict mode, `moduleResolution: bundler`)
- **Vite 6** with `@vitejs/plugin-react`
- **vite-plugin-pwa** — generates a Workbox service worker, web app manifest, and precaches all build assets
- **Path alias** — `@/` maps to `src/`

### State Management
No global state library. State is split across:
- **TanStack Query v5** — all server state (transactions, categories, pattern index, exchange rates). Single `QueryClient` instance with 5-minute default stale time.
- **React `useState`** — local UI state (dialogs, form fields, import flow steps)
- **React Context** — `AuthContext` only (Supabase session + auth helpers)

### Routing
React Router v7 with nested routes:

```
/auth/login          LoginPage       (public)
/auth/register       RegisterPage    (public)
/                    DashboardPage   (protected)
/transactions        TransactionsPage
/import              ImportPage
/analytics           AnalyticsPage
/settings            SettingsPage
```

`AuthGuard` wraps all protected routes — redirects to `/auth/login` if no active session.

### Styling
- **Tailwind CSS v3** with `darkMode: 'class'`
- **shadcn/ui** component library — configured via `components.json`, components live in `src/components/ui/`
- CSS variables for theming — all colors defined as HSL tokens in `src/index.css` under `:root` and `.dark`
- Responsive breakpoint: `md:` (768px) — sidebar visible above, bottom tab nav below

---

## Database (Supabase / PostgreSQL)

### Tables

#### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| name | text | |
| parent_id | uuid FK → categories | nullable, for subcategories |
| icon | text | lucide icon name |
| color | text | hex color |
| is_system | boolean | system categories cannot be deleted |
| created_at | timestamptz | |

Seeded with 12 top-level categories on migration.

#### `pattern_index`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| pattern | text UNIQUE | regex string (case-insensitive) |
| brand | text | e.g. "Zomato" |
| entity_type | text | e.g. "food_delivery" |
| purpose | text | e.g. "food" |
| category_id | uuid FK → categories | |
| confidence | float | 0.0 – 1.0 |
| source | text | `'claude'` or `'user'` |
| created_by | uuid FK → auth.users | nullable (null = system) |
| updated_at | timestamptz | |

#### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | NOT NULL, drives RLS |
| date | date | |
| amount | numeric(15,2) | original currency amount |
| currency | text | ISO 4217, default `'INR'` |
| amount_inr | numeric(15,2) | converted at time of import |
| exchange_rate | numeric(10,6) | rate used for conversion |
| type | text | `'debit'` or `'credit'` |
| method | text | `upi / credit_card / debit_card / net_banking / cash / other` |
| merchant | text | cleaned merchant name |
| raw_narration | text | original bank narration string |
| category_id | uuid FK → categories | |
| subcategory_id | uuid FK → categories | |
| note | text | |
| tags | text[] | default `'{}'` |
| is_recurring | boolean | |
| split_group_id | uuid FK → split_groups | Phase 2, nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexed on: `(user_id, date DESC)`, `(user_id, type)`, `category_id`, `(user_id, merchant)`, `currency`.

#### `exchange_rates`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| currency_pair | text | e.g. `"USD/INR"` |
| rate | numeric(12,6) | `1 foreign = rate INR` |
| fetched_at | timestamptz | |

Acts as a 24-hour cache. App checks `fetched_at >= now() - interval '24 hours'` before hitting external API.

#### Phase 2 tables (migration 002)
`split_groups`, `split_expenses` (with `splits jsonb`), `settlements` — fully specced in `supabase/migrations/002_phase2_split_expenses.sql`, not yet wired to UI.

### Row Level Security
All tables have RLS enabled.

- **transactions** — full CRUD restricted to `auth.uid() = user_id`
- **categories** — public read; write restricted (system categories are immutable)
- **pattern_index** — public read; write only where `created_by = auth.uid()` or `created_by IS NULL` (system/Claude entries)
- **exchange_rates** — public read; insert allowed for any authenticated user
- **split_groups / split_expenses / settlements** — access granted to group creator and all members via `auth.uid() = ANY(members)`

---

## CSV Import Pipeline

```
File upload (PapaParse)
    │
    ├── Known bank? ──► bank-specific parser ──────────────────┐
    │                   (HDFC/SBI/ICICI/Axis/Kotak)            │
    │                                                           ▼
    └── Generic ──────► ColumnMapper UI ──► genericParser  ParsedCSVRow[]
                        (user maps cols)                        │
                                                                ▼
                                                   duplicateDetection
                                                   (date + amount + narration)
                                                                │
                                                                ▼
                                                   patternMatcher (local regex)
                                                   → suggestedCategory per row
                                                                │
                                                                ▼
                                                   ImportPreviewTable
                                                   (user reviews, edits cats)
                                                                │
                                                                ▼
                                             unknown narrations → Claude API (once)
                                                   → upsert pattern_index
                                                                │
                                                                ▼
                                                   bulkInsert to Supabase
```

### Bank Parsers
Each parser is a pure function `(rows: string[][]) => ParsedCSVRow[]`. Column indices and date formats are hardcoded per bank spec. Parsers skip rows where date or amount cannot be parsed.

### Generic Parser
Takes a `ColumnConfig` (date column, date format, narration column, amount mode) and maps raw CSV rows to `ParsedCSVRow[]`. Supports:
- Split mode: separate debit/credit columns (most banks)
- Single mode: one amount column with optional DR/CR type indicator column; negative values treated as debits

### Duplicate Detection
`findDuplicateIndices(incoming, existing)` — exact match on `(date, amount, type)` + normalized narration. Falls back to prefix match (first 20 chars) to handle truncated narrations across different export formats.

---

## Pattern Index & AI Categorization

### Design Goal
One Claude API call per batch of unknown narrations (at most once per import session). All repeat lookups are local.

### Pattern Matching (`src/lib/patternMatcher.ts`)
```
matchPattern(narration, patterns):
  1. Sort patterns: user-defined first, then by confidence DESC
  2. For each pattern, test regex (case-insensitive) against normalized narration
  3. Return first match, or null
```

### Claude Batching (`src/lib/claudeApi.ts`)
- Model: `claude-haiku-4-5-20251001` (fastest, cheapest)
- Single prompt containing all unknown narrations + category list
- Claude returns JSON array: `[{ narration, pattern, brand, entity_type, purpose, category_name, confidence }]`
- Results upserted to `pattern_index` table with `source = 'claude'`
- User overrides set `source = 'user'` and take precedence in matching

### Category Taxonomy
Three orthogonal axes per transaction:
- **Purpose** (top-level): Food & Dining, Shopping, Transport, Entertainment, Health, Education, Utilities, Travel, Finance, Income, Transfer, Other
- **Entity type**: individual, food_delivery, ecommerce, grocery, pharmacy, fuel, streaming, telecom, bank, wallet, government, restaurant, cafe, subscription, transport, utility
- **Brand**: populated by Claude from narration string (Zomato, Amazon, Ola, etc.)

---

## Exchange Rate Handling

- Base currency: **INR** (all analytics rendered in INR)
- `fetchExchangeRates()` — checks Supabase cache first; hits ExchangeRate-API only if no rates fresher than 24h
- All transactions store `amount` (original) + `amount_inr` (at time of import) + `exchange_rate` used
- Historic rates are preserved — recomputing INR amounts years later uses the rate at transaction time

---

## Analytics Queries

All analytics run as Supabase PostgREST queries (no custom SQL functions). Aggregations are done client-side in TanStack Query hooks:

| Hook | Query | Client-side aggregation |
|---|---|---|
| `useMonthlySpend` | select `type, amount_inr` in date range | sum debit/credit |
| `useCategoryBreakdown` | select `amount_inr, category(*)` where debit | group by category_id, compute % |
| `useMerchantSummary` | select `merchant, amount_inr, date` where debit | group by merchant, sort by total |
| `useSpendingTimeline` | select `date, type, amount_inr` | group by day/week/month |
| `useIncomeExpenseSummary` | select all in year | group by YYYY-MM |

---

## PWA Configuration

Service worker strategy: **NetworkFirst** for Supabase API calls (always try network, fall back to cache). All static assets are precached by Workbox on install.

Manifest:
- `display: standalone` — fullscreen app experience on mobile
- Icons at 192×192, 512×512, and maskable 512×512
- `start_url: /` — opens to dashboard

---

## Security

- **No secrets in client bundle** — Supabase anon key is safe to expose (RLS enforces all access control). Claude and ExchangeRate API keys are `VITE_*` prefixed and visible in the bundle — acceptable for personal-use apps; for public multi-tenant deployment, these calls should be proxied through a serverless function.
- **RLS on every table** — database-level enforcement; no user can read or write another user's transactions even if they forge a request
- **Input handling** — amounts parsed with `parseFloat` + validation; dates parsed with `date-fns/parse` with explicit format strings; no `eval` or dynamic SQL
- **CSV parsing** — PapaParse runs entirely client-side; file contents never sent to a server unprocessed

---

## Known Limitations & Future Work

| Area | Current state | Planned improvement |
|---|---|---|
| Bundle size | ~1.1 MB (uncompressed JS) | Code-split by route with `React.lazy` |
| Analytics queries | Client-side aggregation | Move to Postgres views / RPC for large datasets |
| Pattern index | Global (shared across users) | Per-user patterns with fallback to global |
| UPI app exports | Generic CSV mapper | Native parsers for PhonePe/GPay CSV formats once stable |
| Offline support | Static assets cached | Full offline transaction entry with sync queue |
| PDF statements | Not supported | OCR via Tesseract.js or server-side PDF parsing |
| iOS SMS | Not possible on web | Requires native iOS app |
