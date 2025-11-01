import axios from "axios";
import type {
  Broker,
  Stock,
  Portfolio,
  TradingSettings,
  TradingStatus,
} from "@/types";

const API_BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Brokers API
export const brokersApi = {
  getAll: () => api.get<Broker[]>("/brokers"),
  getOne: (id: string) => api.get<Broker>(`/brokers/${id}`),
  create: (data: { name: string; balance?: number }) =>
    api.post<Broker>("/brokers", data),
  update: (id: string, data: Partial<Broker>) =>
    api.patch<Broker>(`/brokers/${id}`, data),
  delete: (id: string) => api.delete(`/brokers/${id}`),

  // Trading operations
  buyStock: (id: string, symbol: string, quantity: number) =>
    api.post<Broker>(`/brokers/${id}/buy`, { symbol, quantity }),
  sellStock: (id: string, symbol: string, quantity: number) =>
    api.post<Broker>(`/brokers/${id}/sell`, { symbol, quantity }),
  getPortfolio: (id: string) => api.get<Portfolio>(`/brokers/${id}/portfolio`),
};

// Stocks API
export const stocksApi = {
  getAll: () => api.get<Stock[]>("/stocks"),
  getOne: (symbol: string) => api.get<Stock>(`/stocks/${symbol}`),
  updateTradingStatus: (symbol: string, isActive: boolean) =>
    api.patch<Stock>(`/stocks/${symbol}/trading-status`, { isActive }),
};

// Trading API
export const tradingApi = {
  getSettings: () => api.get<TradingSettings>("/trading/settings"),
  updateSettings: (data: Partial<TradingSettings>) =>
    api.patch<TradingSettings>("/trading/settings", data),
  start: () => api.post<TradingStatus>("/trading/start"),
  stop: () => api.post("/trading/stop"),
  reset: () => api.post<TradingStatus>("/trading/reset"),
};

export default api;
