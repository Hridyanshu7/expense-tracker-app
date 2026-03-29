import { useState, useEffect, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useCategories } from '@/hooks/useCategories'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { SUPPORTED_CURRENCIES } from '@/constants/currencies'
import type { Transaction, PaymentMethod, TransactionType } from '@/types'

interface TransactionFormDialogProps {
  open: boolean
  transaction: Transaction | null
  onOpenChange: (open: boolean) => void
}

export function TransactionFormDialog({ open, transaction, onOpenChange }: TransactionFormDialogProps) {
  const { data: categories = [] } = useCategories()
  const { mutate: create, isPending: creating } = useCreateTransaction()
  const { mutate: update, isPending: updating } = useUpdateTransaction()

  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [type, setType] = useState<TransactionType>('debit')
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [merchant, setMerchant] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date)
      setAmount(String(transaction.amount))
      setCurrency(transaction.currency)
      setType(transaction.type)
      setMethod(transaction.method ?? 'upi')
      setMerchant(transaction.merchant ?? '')
      setCategoryId(transaction.category_id ?? '')
      setNote(transaction.note ?? '')
    } else {
      setDate(new Date().toISOString().slice(0, 10))
      setAmount('')
      setCurrency('INR')
      setType('debit')
      setMethod('upi')
      setMerchant('')
      setCategoryId('')
      setNote('')
    }
  }, [transaction, open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      date,
      amount: parseFloat(amount),
      currency,
      amount_inr: currency === 'INR' ? parseFloat(amount) : null,
      exchange_rate: null,
      type,
      method,
      merchant: merchant || null,
      raw_narration: merchant || null,
      category_id: categoryId || null,
      subcategory_id: null,
      note: note || null,
      tags: [] as string[],
      is_recurring: false,
      split_group_id: null,
      updated_at: new Date().toISOString(),
    }

    if (transaction) {
      update(
        { id: transaction.id, ...payload },
        {
          onSuccess: () => { toast.success('Transaction updated'); onOpenChange(false) },
          onError: () => toast.error('Failed to update transaction'),
        },
      )
    } else {
      create(payload, {
        onSuccess: () => { toast.success('Transaction added'); onOpenChange(false) },
        onError: () => toast.error('Failed to add transaction'),
      })
    }
  }

  if (!open) return null

  const isPending = creating || updating

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-card sm:rounded-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold">{transaction ? 'Edit transaction' : 'Add transaction'}</h2>
          <button onClick={() => onOpenChange(false)} className="rounded p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Type toggle */}
          <div className="flex rounded-lg border p-1">
            {(['debit', 'credit'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  type === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {t === 'debit' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Amount</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="mb-1 block text-sm font-medium">Merchant / Payee</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Zomato, Amazon"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="mb-1 block text-sm font-medium">Payment method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="upi">UPI</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="net_banking">Net Banking</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-sm font-medium">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-md border py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : transaction ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
