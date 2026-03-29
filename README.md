# Expense Tracker

A best-in-class, multi-user expense tracker built for Indian users. Track every transaction across UPI, credit cards, net banking, cash, and more — from any device via a single URL.

**Live:** https://expense-tracker-app-pied-six.vercel.app

---

## Features

### Core
- **Manual entry** — add any transaction with full metadata (merchant, category, tags, notes, currency)
- **CSV import** — upload statements from HDFC, SBI, ICICI, Axis, Kotak, or any CSV via a generic column mapper
- **Smart categorization** — Claude AI reads raw UPI narration strings once per import, builds a persistent pattern index, and all future matching is local (zero ongoing API cost)
- **Multi-currency** — INR-first with support for USD, EUR, GBP, AED, SGD and more; auto-converted to INR at daily exchange rates

### Analytics
- Spending timeline (day / week / month, zoomable)
- Category breakdown with drill-down
- Merchant ranking and history
- Income vs expense monthly comparison
- Payment method breakdown (UPI / CC / Cash etc.)

### UX
- Responsive PWA — works on any device via URL, installable on mobile
- Sidebar nav on desktop, bottom tab nav on mobile
- Dark mode ready (CSS variables throughout)

### Coming in Phase 2
- Budgets & real-time alerts
- Split expenses with full settlement tracking
- Recurring transaction detection
- Gmail API parsing (zero-cost email import)
- Android SMS parsing via Capacitor

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| CSV Parsing | Papa Parse |
| Routing | React Router v7 |
| Data Fetching | TanStack Query v5 |
| Auth + DB | Supabase (PostgreSQL + Row Level Security) |
| AI Categorization | Claude API (`claude-haiku-4-5`) — batched, not per-transaction |
| Exchange Rates | ExchangeRate-API (free tier) |
| Hosting | Vercel |
| PWA | vite-plugin-pwa + Workbox |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) [Anthropic](https://console.anthropic.com) API key for smart categorization
- (Optional) [ExchangeRate-API](https://exchangerate-api.com) key for multi-currency

### Setup

```bash
git clone https://github.com/Hridyanshu7/expense-tracker-app
cd expense-tracker-app
npm install
cp .env.example .env
```

Fill in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLAUDE_API_KEY=sk-ant-...          # optional
VITE_EXCHANGE_RATE_API_KEY=your-key     # optional
```

### Database

Run both migrations in the Supabase SQL editor (Project → SQL Editor → New query):

```
supabase/migrations/001_initial_schema.sql   ← run first
supabase/migrations/002_phase2_split_expenses.sql
```

Then in Supabase → Authentication → Settings, disable **email confirmations** for local development.

### Run

```bash
npm run dev
```

Open http://localhost:5173

---

## CSV Import

### Known banks (auto-parsed)
| Bank | Date Format | Notes |
|---|---|---|
| HDFC | `DD/MM/YY` | Download from NetBanking → Account Statement → CSV |
| SBI | `DD MMM YYYY` | Download from YONO → Account Statement |
| ICICI | `DD/MM/YYYY` | Download from iMobile / NetBanking |
| Axis | `DD-MM-YYYY` | Download from Internet Banking → Download Statement |
| Kotak | `DD-MM-YYYY` | Download from Net Banking → Account Statement |

### Generic / Any CSV
Select **Other / Generic CSV**, upload any file, and map columns manually:
- Date column + format (auto-detected)
- Narration / description column
- Amount mode: separate debit/credit columns, or single amount column with optional type indicator

Covers UPI app exports, any unlisted bank, or custom formats.

---

## How Smart Categorization Works

1. On import, all unique narration strings are checked against the local **pattern index** (regex → category mappings stored in Supabase)
2. Unmatched narrations are batched into a **single Claude API call** — never one call per transaction
3. Claude returns structured mappings (brand, entity type, purpose, category) which are saved to the pattern index
4. All future lookups are local regex matching — no further API calls
5. User corrections override Claude entries and persist permanently

After 2–3 import cycles, the index covers nearly all your regular merchants and Claude is rarely needed.

---

## Project Structure

```
src/
├── components/
│   ├── analytics/      # Recharts-based chart components
│   ├── auth/           # AuthGuard
│   ├── common/         # Spinner, EmptyState, ErrorBoundary
│   ├── dashboard/      # Dashboard card components
│   ├── import/         # CSV import flow + bank parsers + ColumnMapper
│   ├── layout/         # AppLayout, SidebarNav, BottomTabNav
│   └── transactions/   # Table, List, FormDialog, FilterBar
├── constants/          # Banks, categories, currencies, filter presets
├── contexts/           # AuthContext
├── hooks/              # TanStack Query hooks (transactions, analytics, import…)
├── lib/                # supabase, claudeApi, patternMatcher, exchangeRate, utils
├── pages/              # Page-level components
├── types/              # Shared TypeScript interfaces
└── utils/              # formatters, dateHelpers, csvExport, duplicateDetection
supabase/
└── migrations/         # SQL schema + RLS policies + seed data
```

---

## Deployment

The app auto-deploys to Vercel on every push to `main`.

To deploy manually:
```bash
vercel --prod
```

Set these environment variables in the Vercel dashboard (Settings → Environment Variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLAUDE_API_KEY`
- `VITE_EXCHANGE_RATE_API_KEY`
