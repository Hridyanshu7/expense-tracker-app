import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { FilterBar } from '@/components/transactions/FilterBar'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionFormDialog } from '@/components/transactions/TransactionFormDialog'
import { useTransactions } from '@/hooks/useTransactions'
import { getDefaultFilterState } from '@/constants/filters'
import type { FilterState, Transaction } from '@/types'

export default function TransactionsPage() {
  const [filters, setFilters] = useState<FilterState>(getDefaultFilterState())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)

  const { data: transactions = [], isLoading } = useTransactions(filters)

  function handleEdit(txn: Transaction) {
    setEditingTxn(txn)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditingTxn(null)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Transactions"
        subtitle={`${transactions.length} transactions`}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        }
      />

      <div className="p-6">
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Desktop table */}
        <div className="mt-4 hidden md:block">
          <TransactionTable
            transactions={transactions}
            loading={isLoading}
            onEdit={handleEdit}
          />
        </div>

        {/* Mobile list */}
        <div className="mt-4 md:hidden">
          <TransactionList
            transactions={transactions}
            loading={isLoading}
            onEdit={handleEdit}
          />
        </div>
      </div>

      <TransactionFormDialog
        open={dialogOpen}
        transaction={editingTxn}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
