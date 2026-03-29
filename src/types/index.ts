// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type TransactionType = 'debit' | 'credit'

export type PaymentMethod =
  | 'upi'
  | 'credit_card'
  | 'debit_card'
  | 'net_banking'
  | 'cash'
  | 'other'

export type PatternSource = 'claude' | 'user'

export type BankName = 'hdfc' | 'sbi' | 'icici' | 'axis' | 'kotak' | 'generic'

// Column mapping config for generic CSV imports
export interface ColumnConfig {
  dateColumn: string
  dateFormat: string            // date-fns format string e.g. "dd/MM/yyyy"
  narrationColumn: string
  amountMode: 'split' | 'single'
  // split mode: separate debit and credit columns
  debitColumn?: string
  creditColumn?: string
  // single mode: one amount column, optional type indicator column
  amountColumn?: string
  typeColumn?: string           // column containing "DR"/"CR" etc.
  typeDebitValues: string[]     // values that mean debit e.g. ["DR","D","Debit","debit"]
}

export type DateRangePreset =
  | 'this_week'
  | 'this_month'
  | 'last_3m'
  | 'last_6m'
  | 'ytd'
  | 'custom'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  parent_id: string | null
  icon: string | null
  color: string | null
  is_system: boolean
  created_at: string
}

export interface PatternIndex {
  id: string
  pattern: string           // regex string e.g. "ZOMATO|zomato"
  brand: string | null
  entity_type: string | null
  purpose: string | null
  category_id: string | null
  confidence: number        // 0.0 – 1.0
  source: PatternSource
  created_by: string | null
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  date: string              // ISO date string YYYY-MM-DD
  amount: number
  currency: string          // ISO 4217 e.g. "INR", "USD"
  amount_inr: number | null
  exchange_rate: number | null
  type: TransactionType
  method: PaymentMethod | null
  merchant: string | null
  raw_narration: string | null
  category_id: string | null
  subcategory_id: string | null
  note: string | null
  tags: string[]
  is_recurring: boolean
  split_group_id: string | null
  created_at: string
  updated_at: string
  // Joined fields (not in DB, populated by query)
  category?: Category
  subcategory?: Category
}

export interface ExchangeRate {
  id: string
  currency_pair: string     // e.g. "USD/INR"
  rate: number
  fetched_at: string
}

// ─── Phase 2: Split Expenses ─────────────────────────────────────────────────

export interface SplitMember {
  user_id: string
  amount: number
  settled: boolean
}

export interface SplitGroup {
  id: string
  name: string
  created_by: string
  members: string[]         // array of user_ids
  created_at: string
}

export interface SplitExpense {
  id: string
  group_id: string
  transaction_id: string
  total_amount: number
  currency: string
  paid_by: string
  splits: SplitMember[]
  created_at: string
}

export interface Settlement {
  id: string
  group_id: string
  from_user: string
  to_user: string
  amount: number
  currency: string
  settled_at: string
}

// ─── Import / CSV ─────────────────────────────────────────────────────────────

export interface ParsedCSVRow {
  date: string              // YYYY-MM-DD
  amount: number
  type: TransactionType
  raw_narration: string
  merchant?: string
  currency: string
  method: PaymentMethod
  bank: BankName
}

export interface ImportPreviewRow extends ParsedCSVRow {
  isDuplicate: boolean
  parseError?: string
  suggestedCategory?: Category
  selected: boolean         // whether user has included this row for import
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date
  to: Date
}

export interface FilterState {
  preset: DateRangePreset
  dateRange: DateRange
  categoryIds: string[]
  methods: PaymentMethod[]
  currencies: string[]
  amountMin: number | null
  amountMax: number | null
  tags: string[]
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalDebit: number
  totalCredit: number
  net: number
  transactionCount: number
  currency: string
}

export interface CategorySpend {
  category: Category
  total: number
  count: number
  percentage: number
}

export interface MerchantSummary {
  merchant: string
  total: number
  count: number
  avgAmount: number
  lastDate: string
}

export interface TimelinePoint {
  date: string
  debit: number
  credit: number
}

export interface MonthlyIncomeExpense {
  month: string             // YYYY-MM
  income: number
  expense: number
  net: number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  default_currency: string
  created_at: string
}
