import type { BankName, ParsedCSVRow } from '@/types'
import { parseHDFC } from './hdfcParser'
import { parseSBI } from './sbiParser'
import { parseICICI } from './iciciParser'
import { parseAxis } from './axisParser'
import { parseKotak } from './kotakParser'

export type BankParser = (rows: string[][]) => ParsedCSVRow[]

const PARSERS: Partial<Record<BankName, BankParser>> = {
  hdfc: parseHDFC,
  sbi: parseSBI,
  icici: parseICICI,
  axis: parseAxis,
  kotak: parseKotak,
  // 'generic' is handled separately via ColumnConfig — no static parser
}

export function getBankParser(bank: BankName): BankParser | null {
  return PARSERS[bank] ?? null
}

export { parseHDFC, parseSBI, parseICICI, parseAxis, parseKotak }
export { parseGeneric, autoDetectDateFormat } from './genericParser'
