import { supabase } from '@/lib/supabase'

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY as string
const CACHE_TTL_HOURS = 24

export type RateMap = Record<string, number>

/**
 * Fetches exchange rates with base currency INR.
 * First checks the Supabase cache — only hits the external API if the
 * cached rates are older than CACHE_TTL_HOURS.
 */
export async function fetchExchangeRates(): Promise<RateMap> {
  // Check cache freshness
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - CACHE_TTL_HOURS)

  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('currency_pair, rate')
    .gte('fetched_at', cutoff.toISOString())
    .limit(200)

  if (cached && cached.length > 0) {
    const rates: RateMap = {}
    for (const row of cached) {
      // currency_pair format: "USD/INR" → rates["USD"] = rate
      const [from] = row.currency_pair.split('/')
      rates[from] = row.rate
    }
    rates['INR'] = 1
    return rates
  }

  // Cache miss — fetch from API
  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/INR`,
  )
  if (!response.ok) {
    throw new Error(`ExchangeRate API error: ${response.status}`)
  }

  const json = (await response.json()) as {
    result: string
    conversion_rates: Record<string, number>
  }

  if (json.result !== 'success') {
    throw new Error('ExchangeRate API returned non-success result')
  }

  // INR rates are stored as "1 INR = X foreign", but we want "1 foreign = Y INR"
  const rates: RateMap = { INR: 1 }
  const rows: { currency_pair: string; rate: number; fetched_at: string }[] = []
  const now = new Date().toISOString()

  for (const [currency, inrPerUnit] of Object.entries(json.conversion_rates)) {
    if (currency === 'INR') continue
    const foreignToINR = 1 / inrPerUnit
    rates[currency] = foreignToINR
    rows.push({ currency_pair: `${currency}/INR`, rate: foreignToINR, fetched_at: now })
  }

  // Store in Supabase cache (fire-and-forget)
  supabase.from('exchange_rates').insert(rows).then(() => {})

  return rates
}

/**
 * Converts an amount in any currency to INR using the provided rate map.
 */
export function convertToINR(
  amount: number,
  currency: string,
  rates: RateMap,
): number {
  if (currency === 'INR') return amount
  const rate = rates[currency]
  if (!rate) return amount // fallback: return as-is if currency unknown
  return amount * rate
}
