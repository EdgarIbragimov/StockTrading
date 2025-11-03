export interface Broker {
  id: string;
  name: string;
  balance: number;
  stocks: BrokerStock[];
  createdAt: string;
  updatedAt: string;
}

export interface BrokerStock {
  symbol: string;
  quantity: number;
  averagePrice: number;
}

export interface Stock {
  symbol: string;
  companyName: string;
  isActive: boolean;
  currentPrice: string;
  historicalData: StockPrice[];
}

export interface StockPrice {
  date: string;
  open: string;
}

export interface PortfolioItem {
  symbol: string;
  companyName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  broker: Broker;
  portfolio: PortfolioItem[];
  totalBalance: number;
  totalStocksValue: number;
  totalInvested: number;
  totalProfitLoss: number;
}

export interface TradingSettings {
  startDate: string;
  speedFactor: number;
  isActive: boolean;
  currentDate?: string;
}

export interface TradingStatus {
  isActive: boolean;
  currentDate: string;
  stockPrices: {
    symbol: string;
    price: string;
  }[];
}
