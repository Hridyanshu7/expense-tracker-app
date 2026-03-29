import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter'
import { SpendingTimelineChart } from '@/components/analytics/SpendingTimelineChart'
import { CategoryBreakdownChart } from '@/components/analytics/CategoryBreakdownChart'
import { MerchantView } from '@/components/analytics/MerchantView'
import { IncomeExpenseSummary } from '@/components/analytics/IncomeExpenseSummary'
import { PaymentMethodChart } from '@/components/analytics/PaymentMethodChart'
import { getDefaultFilterState } from '@/constants/filters'
import type { FilterState } from '@/types'

const TABS = ['Timeline', 'Categories', 'Merchants', 'Income vs Expense', 'Payment Methods'] as const
type Tab = (typeof TABS)[number]

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<FilterState>(getDefaultFilterState())
  const [activeTab, setActiveTab] = useState<Tab>('Timeline')

  return (
    <div className="flex flex-col">
      <PageHeader title="Analytics" subtitle="Understand your spending patterns" />

      <div className="p-6">
        <DateRangeFilter filters={filters} onChange={setFilters} />

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'Timeline' && <SpendingTimelineChart filters={filters} />}
          {activeTab === 'Categories' && <CategoryBreakdownChart filters={filters} />}
          {activeTab === 'Merchants' && <MerchantView filters={filters} />}
          {activeTab === 'Income vs Expense' && (
            <IncomeExpenseSummary year={new Date().getFullYear()} />
          )}
          {activeTab === 'Payment Methods' && <PaymentMethodChart filters={filters} />}
        </div>
      </div>
    </div>
  )
}
