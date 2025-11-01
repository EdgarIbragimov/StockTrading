import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { TradingStatus, TradingSettings } from '@/types'

const socket = ref<Socket | null>(null)
const isConnected = ref(false)
const currentDate = ref<string>('')
const stockPrices = ref<Array<{ symbol: string; price: string }>>([])
const tradingSettings = ref<TradingSettings | null>(null)

export function useSocket() {
  const connect = () => {
    if (socket.value?.connected) return

    socket.value = io('http://localhost:3000')

    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('WebSocket connected')
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      console.log('WebSocket disconnected')
    })

    socket.value.on('tradingStatus', (data: TradingStatus) => {
      currentDate.value = data.currentDate
      stockPrices.value = data.stockPrices
//      console.log('Trading status update:', data)
    })

    socket.value.on('tradingSettings', (data: TradingSettings) => {
      tradingSettings.value = data
//      console.log('Trading settings:', data)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  return {
    socket,
    isConnected,
    currentDate,
    stockPrices,
    tradingSettings,
    connect,
    disconnect
  }
}

