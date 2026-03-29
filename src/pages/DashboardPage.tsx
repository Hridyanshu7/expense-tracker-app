import { PageHeader } from '@/components/layout/PageHeader'
import { NetSpendCard } from '@/components/dashboard/NetSpendCard'
import { TopCategoriesCard } from '@/components/dashboard/TopCategoriesCard'
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard'
import { QuickAddFab } from '@/components/dashboard/QuickAddFab'

export default function DashboardPage() {
  const now = new Date()

  return (
    <div className="relative flex flex-col">
      <PageHeader title="Dashboard" subtitle="Your financial overview" />

      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <NetSpendCard year={now.getFullYear()} month={now.getMonth() + 1} />
        </div>
        <div className="lg:col-span-2">
          <TopCategoriesCard year={now.getFullYear()} month={now.getMonth() + 1} />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <RecentTransactionsCard />
        </div>
      </div>

      <QuickAddFab />
    </div>
  )
}
