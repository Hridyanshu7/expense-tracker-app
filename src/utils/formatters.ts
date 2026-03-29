import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { getCurrencySymbol } from '@/constants/currencies'
import type { TransactionType, PaymentMethod } from '@/types'

export function formatCurrency(
  amount: number,
  currency = 'INR',
  opts?: { compact?: boolean; showSymbol?: boolean },
): string {
  const { compact = false, showSymbol = true } = opts ?? {}
  const symbol = showSymbol ? getCurrencySymbol(currency) : ''

  if (compact && Math.abs(amount) >= 1_00_000) {
    const lakh = amount / 1_00_000
    return `${symbol}${lakh.toFixed(1)}L`
  }
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000
    return `${symbol}${k.toFixed(1)}K`
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return `${symbol}${formatted}`
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatTransactionType(type: TransactionType): string {
  return type === 'debit' ? 'Expense' : 'Income'
}

export function formatPaymentMethod(method: PaymentMethod | null): string {
  const map: Record<PaymentMethod, string> = {
    upi: 'UPI',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    net_banking: 'Net Banking',
    cash: 'Cash',
    other: 'Other',
  }
  return method ? map[method] : '—'
}

export function formatAmountWithSign(amount: number, type: TransactionType): string {
  const prefix = type === 'debit' ? '−' : '+'
  return `${prefix}${formatCurrency(amount)}`
}
