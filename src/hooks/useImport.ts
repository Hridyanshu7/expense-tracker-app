import { useState } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { getBankParser, parseGeneric } from '@/components/import/bankParsers'
import { findDuplicateIndices } from '@/utils/duplicateDetection'
import { matchPattern, extractUnmatchedNarrations } from '@/lib/patternMatcher'
import { batchCategorize } from '@/lib/claudeApi'
import { usePatternIndex, useUpsertPatterns } from '@/hooks/usePatternIndex'
import { useCategories } from '@/hooks/useCategories'
import { useBulkInsertTransactions } from '@/hooks/useTransactions'
import { useConvertToINR } from '@/hooks/useExchangeRates'
import type { BankName, ColumnConfig, ImportPreviewRow, Transaction } from '@/types'

export type ImportStep = 'select' | 'map-columns' | 'preview' | 'done'

export function useImportFlow(existingTransactions: Transaction[]) {
  const [step, setStep] = useState<ImportStep>('select')
  const [selectedBank, setSelectedBank] = useState<BankName | null>(null)
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([])
  const [importing, setImporting] = useState(false)

  // Raw CSV data — kept in state so ColumnMapper can use it
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])

  const { data: patterns = [] } = usePatternIndex()
  const { data: categories = [] } = useCategories()
  const { mutateAsync: upsertPatterns } = useUpsertPatterns()
  const { mutateAsync: bulkInsert } = useBulkInsertTransactions()
  const convertToINR = useConvertToINR()

  function setBank(bank: BankName) {
    setSelectedBank(bank)
  }

  function buildPreviewRows(parsed: ReturnType<typeof parseGeneric>) {
    const duplicateIndices = findDuplicateIndices(parsed, existingTransactions)
    return parsed.map((row, i) => {
      const match = matchPattern(row.raw_narration, patterns)
      const suggestedCategory = match?.category_id
        ? categories.find((c) => c.id === match.category_id)
        : undefined
      return {
        ...row,
        isDuplicate: duplicateIndices.has(i),
        suggestedCategory,
        selected: !duplicateIndices.has(i),
      }
    })
  }

  function parseFile(file: File) {
    if (!selectedBank) return

    Papa.parse<string[]>(file, {
      complete: (results) => {
        const allRows = results.data

        if (selectedBank === 'generic') {
          // Find the header row — first non-empty row
          const headerRowIdx = allRows.findIndex((r) => r.some((c) => c.trim().length > 0))
          if (headerRowIdx === -1) { toast.error('CSV appears empty'); return }

          const headers = allRows[headerRowIdx].map((h) => h.trim()).filter(Boolean)
          const dataRows = allRows.slice(headerRowIdx + 1).filter((r) => r.some((c) => c.trim()))

          setRawHeaders(headers)
          setRawRows(dataRows)
          setStep('map-columns')
        } else {
          const parser = getBankParser(selectedBank)
          if (!parser) { toast.error('Parser not found for this bank'); return }

          const parsed = parser(allRows)
          if (parsed.length === 0) {
            toast.error('No transactions parsed — check the file format')
            return
          }
          setPreviewRows(buildPreviewRows(parsed))
          setStep('preview')
        }
      },
      error: (err) => {
        toast.error(`CSV parse error: ${err.message}`)
      },
    })
  }

  function applyColumnConfig(config: ColumnConfig) {
    const parsed = parseGeneric(rawRows, config, rawHeaders)
    if (parsed.length === 0) {
      toast.error('No transactions parsed with this column mapping — check your settings')
      return
    }
    setPreviewRows(buildPreviewRows(parsed))
    setStep('preview')
  }

  function toggleRow(index: number) {
    setPreviewRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)),
    )
  }

  function updateRowCategory(index: number, categoryId: string) {
    const category = categories.find((c) => c.id === categoryId)
    setPreviewRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, suggestedCategory: category } : r)),
    )
  }

  async function confirmImport() {
    const selected = previewRows.filter((r) => r.selected)
    if (selected.length === 0) { toast.error('No transactions selected'); return }

    setImporting(true)
    try {
      const narrations = selected.map((r) => r.raw_narration)
      const unmatched = extractUnmatchedNarrations(narrations, patterns)

      if (unmatched.length > 0) {
        toast.info(`Categorizing ${unmatched.length} new patterns…`)
        try {
          const newPatterns = await batchCategorize(unmatched, categories)
          if (newPatterns.length > 0) await upsertPatterns(newPatterns)
        } catch {
          toast.warning('Auto-categorization failed — importing uncategorized')
        }
      }

      const toInsert = selected.map((r) => ({
        date: r.date,
        amount: r.amount,
        currency: r.currency,
        amount_inr: r.currency === 'INR' ? r.amount : convertToINR(r.amount, r.currency),
        exchange_rate: null,
        type: r.type,
        method: r.method,
        merchant: r.merchant ?? null,
        raw_narration: r.raw_narration,
        category_id: r.suggestedCategory?.id ?? null,
        subcategory_id: null,
        note: null,
        tags: [] as string[],
        is_recurring: false,
        split_group_id: null,
        updated_at: new Date().toISOString(),
      }))

      await bulkInsert(toInsert)
      toast.success(`Imported ${toInsert.length} transactions`)
      setStep('done')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep('select')
    setSelectedBank(null)
    setPreviewRows([])
    setRawHeaders([])
    setRawRows([])
  }

  function goBackFromPreview() {
    setStep(selectedBank === 'generic' ? 'map-columns' : 'select')
  }

  return {
    step,
    selectedBank,
    previewRows,
    rawHeaders,
    rawRows,
    importing,
    setBank,
    parseFile,
    applyColumnConfig,
    toggleRow,
    updateRowCategory,
    confirmImport,
    reset,
    goBackFromPreview,
  }
}
