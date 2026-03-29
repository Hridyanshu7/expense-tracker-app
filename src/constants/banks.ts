import type { BankName } from '@/types'

export interface BankConfig {
  id: BankName
  label: string
  dateFormat: string
  description: string
}

export const SUPPORTED_BANKS: BankConfig[] = [
  {
    id: 'generic',
    label: 'Other / Generic CSV',
    dateFormat: 'auto-detected',
    description: 'Any CSV from UPI apps, other banks, or custom exports — map columns manually',
  },
  {
    id: 'hdfc',
    label: 'HDFC Bank',
    dateFormat: 'dd/MM/yy',
    description: 'Download from HDFC NetBanking → Account Statement → CSV',
  },
  {
    id: 'sbi',
    label: 'SBI',
    dateFormat: 'dd MMM yyyy',
    description: 'Download from SBI YONO → Account Statement → Excel/CSV',
  },
  {
    id: 'icici',
    label: 'ICICI Bank',
    dateFormat: 'dd/MM/yyyy',
    description: 'Download from ICICI iMobile/NetBanking → Statement → CSV',
  },
  {
    id: 'axis',
    label: 'Axis Bank',
    dateFormat: 'dd-MM-yyyy',
    description: 'Download from Axis Internet Banking → Account → Download Statement',
  },
  {
    id: 'kotak',
    label: 'Kotak Mahindra',
    dateFormat: 'dd-MM-yyyy',
    description: 'Download from Kotak Net Banking → Account Statement → CSV',
  },
]

export const BANK_CONFIG: Record<BankName, BankConfig> = Object.fromEntries(
  SUPPORTED_BANKS.map((b) => [b.id, b]),
) as Record<BankName, BankConfig>
