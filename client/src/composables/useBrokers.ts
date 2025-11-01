import { ref } from 'vue'
import { brokersApi } from '@/services/api'
import type { Broker, Portfolio } from '@/types'

export function useBrokers() {
  const brokers = ref<Broker[]>([])
  const currentBroker = ref<Broker | null>(null)
  const portfolio = ref<Portfolio | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBrokers = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await brokersApi.getAll()
      brokers.value = response.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch brokers'
      console.error('Error fetching brokers:', e)
    } finally {
      loading.value = false
    }
  }

  const fetchBroker = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await brokersApi.getOne(id)
      currentBroker.value = response.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch broker'
      console.error('Error fetching broker:', e)
    } finally {
      loading.value = false
    }
  }

  const fetchPortfolio = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await brokersApi.getPortfolio(id)
      portfolio.value = response.data
      currentBroker.value = response.data.broker
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch portfolio'
      console.error('Error fetching portfolio:', e)
    } finally {
      loading.value = false
    }
  }

  const buyStock = async (brokerId: string, symbol: string, quantity: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await brokersApi.buyStock(brokerId, symbol, quantity)
      currentBroker.value = response.data
      // Обновляем портфель после покупки
      await fetchPortfolio(brokerId)
      return true
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to buy stock'
      console.error('Error buying stock:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  const sellStock = async (brokerId: string, symbol: string, quantity: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await brokersApi.sellStock(brokerId, symbol, quantity)
      currentBroker.value = response.data
      // Обновляем портфель после продажи
      await fetchPortfolio(brokerId)
      return true
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Failed to sell stock'
      console.error('Error selling stock:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    brokers,
    currentBroker,
    portfolio,
    loading,
    error,
    fetchBrokers,
    fetchBroker,
    fetchPortfolio,
    buyStock,
    sellStock
  }
}

