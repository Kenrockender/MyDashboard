import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PphUmkmEstimate {
  year: number;
  grossRevenueIdr: number;
  exemptThresholdIdr: number;
  taxableAmountIdr: number;
  rate: number;
  estimatedTaxIdr: number;
}

export function usePphUmkmEstimate(year: number) {
  return useQuery({
    queryKey: ['tax', 'pph-umkm', year],
    queryFn: () => apiClient.get<PphUmkmEstimate>(`/tax/pph-umkm?year=${year}`),
    enabled: !!year,
  });
}
