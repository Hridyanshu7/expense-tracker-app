import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { SUPPORTED_BANKS } from '@/constants/banks'
import { cn } from '@/lib/utils'
import type { BankName } from '@/types'

interface BankSelectorProps {
  selectedBank: BankName | null
  onSelectBank: (bank: BankName) => void
  onFileSelect: (file: File) => void
}

const generic = SUPPORTED_BANKS.find((b) => b.id === 'generic')!
const banks = SUPPORTED_BANKS.filter((b) => b.id !== 'generic')

export function BankSelector({ selectedBank, onSelectBank, onFileSelect }: BankSelectorProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      e.target.value = ''   // allow re-uploading same file
      onFileSelect(file)
    }
  }

  const selectedConfig = SUPPORTED_BANKS.find((b) => b.id === selectedBank)

  return (
    <div className="max-w-xl space-y-6">
      {/* Generic / Other — prominent top option */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Source type</h3>
        <button
          onClick={() => onSelectBank('generic')}
          className={cn(
            'w-full rounded-xl border-2 p-4 text-left transition-colors',
            selectedBank === 'generic'
              ? 'border-primary bg-primary/5'
              : 'border-dashed border-muted-foreground/30 hover:border-primary/50',
          )}
        >
          <div className="font-semibold">{generic.label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{generic.description}</div>
        </button>
      </div>

      {/* Known banks */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">
          Or select a known bank <span className="font-normal text-muted-foreground">(auto-mapped)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {banks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => onSelectBank(bank.id as BankName)}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-colors',
                selectedBank === bank.id
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted hover:border-muted-foreground/30',
              )}
            >
              <div className="font-medium">{bank.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{bank.dateFormat}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload section */}
      {selectedBank && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Upload CSV file</h3>
          {selectedConfig && (
            <p className="mb-3 text-xs text-muted-foreground">{selectedConfig.description}</p>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-10 text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">Click to upload CSV</span>
            <span className="text-xs">Any .csv file</span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}
    </div>
  )
}
