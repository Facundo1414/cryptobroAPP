import { create } from "zustand";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

interface Signal {
  id: string;
  cryptoSymbol: string;
  type: "BUY" | "SELL";
  strategy: string;
  price: number;
  confidence: number;
  reason: string;
  timestamp: number;
}

interface Alert {
  id: string;
  cryptoSymbol: string;
  message: string;
  type: "PRICE" | "SIGNAL";
  timestamp: number;
}

interface MarketDataState {
  prices: Map<string, PriceData>;
  signals: Signal[];
  alerts: Alert[];

  updatePrice: (data: PriceData) => void;
  addSignal: (signal: Signal) => void;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  prices: new Map(),
  signals: [],
  alerts: [],

  updatePrice: (data) =>
    set((state) => {
      const newPrices = new Map(state.prices);
      newPrices.set(data.symbol, data);
      return { prices: newPrices };
    }),

  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 50), // Keep last 50
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 20), // Keep last 20
    })),

  clearAlerts: () => set({ alerts: [] }),
}));
