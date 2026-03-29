import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TransactionFormDialog } from '@/components/transactions/TransactionFormDialog'

export function QuickAddFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:hidden"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TransactionFormDialog open={open} transaction={null} onOpenChange={setOpen} />
    </>
  )
}
