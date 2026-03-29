import { useQuery } from '@tanstack/react-query'
import { fetchExchangeRates, convertToINR, type RateMap } from '@/lib/exchangeRate'

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchangeRates'],
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  })
}

export function useConvertToINR() {
  const { data: rates } = useExchangeRates()
  return (amount: number, currency: string): number => {
    if (!rates) return amount
    return convertToINR(amount, currency, rates as RateMap)
  }
}
