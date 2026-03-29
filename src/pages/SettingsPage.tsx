import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { exportTransactionsToCSV } from '@/utils/csvExport'
import { useTransactions } from '@/hooks/useTransactions'
import { getDefaultFilterState } from '@/constants/filters'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { data: allTransactions = [] } = useTransactions({
    ...getDefaultFilterState(),
    dateRange: { from: new Date('2000-01-01'), to: new Date() },
    preset: 'ytd',
  })

  function handleExport() {
    exportTransactionsToCSV(allTransactions)
    toast.success('Exported all transactions')
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" />

      <div className="max-w-xl space-y-8 p-6">
        {/* Profile */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <div className="rounded-lg border p-4 text-sm">
            <div className="text-muted-foreground">Signed in as</div>
            <div className="mt-1 font-medium">{user?.email}</div>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Data</h2>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full rounded-lg border px-4 py-3 text-left text-sm hover:bg-accent"
            >
              <div className="font-medium">Export all transactions</div>
              <div className="text-muted-foreground">Download a CSV of all your data</div>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-destructive">Danger Zone</h2>
          <button
            onClick={() => void signOut()}
            className="w-full rounded-lg border border-destructive/30 px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/5"
          >
            <div className="font-medium">Sign out</div>
          </button>
        </section>
      </div>
    </div>
  )
}
