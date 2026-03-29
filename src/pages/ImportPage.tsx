import { CheckCircle, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { BankSelector } from '@/components/import/BankSelector'
import { ColumnMapper } from '@/components/import/ColumnMapper'
import { ImportPreviewTable } from '@/components/import/ImportPreviewTable'
import { useImportFlow } from '@/hooks/useImport'
import { useTransactions } from '@/hooks/useTransactions'
import { getDefaultFilterState } from '@/constants/filters'

const STEPS = ['Select source & file', 'Map columns', 'Review & confirm', 'Done']

// Map import step → stepper index
function stepIndex(step: ReturnType<typeof useImportFlow>['step']): number {
  return { select: 0, 'map-columns': 1, preview: 2, done: 3 }[step]
}

export default function ImportPage() {
  const { data: allTransactions = [] } = useTransactions({
    ...getDefaultFilterState(),
    preset: 'ytd',
    dateRange: { from: new Date('2000-01-01'), to: new Date() },
  })

  const flow = useImportFlow(allTransactions)
  const currentStep = stepIndex(flow.step)

  // For known-bank imports, step 1 (map columns) is skipped — hide it from the stepper
  const isGeneric = flow.selectedBank === 'generic'
  const visibleSteps = isGeneric ? STEPS : STEPS.filter((_, i) => i !== 1)
  const visibleIndex = isGeneric
    ? currentStep
    : currentStep === 0 ? 0 : currentStep - 1   // shift preview/done back by 1

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Import Transactions"
        subtitle="Upload any CSV — from a bank, UPI app, or custom export"
      />

      <div className="p-6">
        {/* Stepper */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {visibleSteps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < visibleIndex
                    ? 'bg-primary text-primary-foreground'
                    : i === visibleIndex
                    ? 'border-2 border-primary text-primary'
                    : 'border bg-muted text-muted-foreground'
                }`}
              >
                {i < visibleIndex ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i === visibleIndex ? 'font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < visibleSteps.length - 1 && <div className="mx-1 h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {flow.step === 'select' && (
          <BankSelector
            selectedBank={flow.selectedBank}
            onSelectBank={flow.setBank}
            onFileSelect={flow.parseFile}
          />
        )}

        {flow.step === 'map-columns' && (
          <ColumnMapper
            headers={flow.rawHeaders}
            previewRows={flow.rawRows}
            onConfirm={flow.applyColumnConfig}
            onBack={flow.reset}
          />
        )}

        {flow.step === 'preview' && (
          <ImportPreviewTable
            rows={flow.previewRows}
            onToggleRow={flow.toggleRow}
            onUpdateCategory={flow.updateRowCategory}
            onBack={flow.goBackFromPreview}
            onConfirm={() => void flow.confirmImport()}
            importing={flow.importing}
          />
        )}

        {flow.step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-16">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-xl font-bold">Import complete!</h2>
            <p className="text-muted-foreground">Your transactions have been imported and categorized.</p>
            <button
              onClick={flow.reset}
              className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              <Upload className="h-4 w-4" />
              Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
