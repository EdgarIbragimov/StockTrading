import { ref } from 'vue'
import { stocksApi } from '@/services/api'
import type { Stock } from '@/types'

export function useStocks() {
  const stocks = ref<Stock[]>([])
  const currentStock = ref<Stock | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStocks = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await stocksApi.getAll()
      stocks.value = response.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch stocks'
      console.error('Error fetching stocks:', e)
    } finally {
      loading.value = false
    }
  }

  const fetchStock = async (symbol: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await stocksApi.getOne(symbol)
      currentStock.value = response.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch stock'
      console.error('Error fetching stock:', e)
    } finally {
      loading.value = false
    }
  }

  const parsePrice = (priceStr: string): number => {
    return parseFloat(priceStr.replace('$', ''))
  }

  return {
    stocks,
    currentStock,
    loading,
    error,
    fetchStocks,
    fetchStock,
    parsePrice
  }
}

