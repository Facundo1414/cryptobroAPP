import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";

// Use relative URL for the API - the proxy will handle it
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (refreshToken) {
              const response = await axios.post(
                `${API_BASE_URL}/auth/refresh`,
                {
                  refreshToken,
                },
              );

              const { accessToken } = response.data;
              useAuthStore.getState().setTokens(accessToken, refreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    apiClient.post("/auth/register", { email, password, name }),

  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),

  logout: () => apiClient.post("/auth/logout"),

  getProfile: () => apiClient.get("/auth/profile"),

  refreshToken: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
};

// Market Data API
export const marketDataApi = {
  getCurrentPrice: (symbol: string) =>
    apiClient.get(`/market-data/price/${symbol}`),

  get24hrTicker: (symbol: string) =>
    apiClient.get(`/market-data/ticker/${symbol}`),

  getCandles: (symbol: string, interval: string, limit?: number) =>
    apiClient.get(`/market-data/candles/${symbol}`, {
      params: { interval, limit },
    }),
};

// Indicators API
export const indicatorsApi = {
  getAnalysis: (symbol: string, timeframe: string) =>
    apiClient.get(`/indicators/analysis/${symbol}`, { params: { timeframe } }),

  getRSI: (symbol: string, timeframe: string, period?: number) =>
    apiClient.get(`/indicators/rsi/${symbol}`, {
      params: { timeframe, period },
    }),

  getMACD: (symbol: string, timeframe: string) =>
    apiClient.get(`/indicators/macd/${symbol}`, { params: { timeframe } }),
};

// Strategies API
export const strategiesApi = {
  getAll: () => apiClient.get("/strategies"),

  getConsensus: (symbol: string, timeframe: string) =>
    apiClient.get(`/strategies/consensus/${symbol}`, { params: { timeframe } }),

  analyzeWithStrategy: (symbol: string, strategy: string, timeframe: string) =>
    apiClient.get(`/strategies/analyze/${symbol}`, {
      params: { strategy, timeframe },
    }),
};

// Signals API
export const signalsApi = {
  getRecent: (limit?: number, cryptoSymbol?: string) =>
    apiClient.get("/signals/recent", { params: { limit, cryptoSymbol } }),

  generate: (cryptoSymbol: string, timeframe: string) =>
    apiClient.post(`/signals/generate/${cryptoSymbol}`, null, {
      params: { timeframe },
    }),

  getStatistics: (cryptoSymbol?: string, days?: number) =>
    apiClient.get("/signals/statistics", { params: { cryptoSymbol, days } }),
};

// Alerts API
export const alertsApi = {
  create: (data: {
    cryptoSymbol: string;
    condition: "ABOVE" | "BELOW";
    targetPrice: number;
    message?: string;
  }) => apiClient.post("/alerts", data),

  getAll: () => apiClient.get("/alerts"),

  delete: (id: string) => apiClient.delete(`/alerts/${id}`),
};

// Backtesting API
export const backtestingApi = {
  create: (data: {
    strategyId: string;
    cryptoSymbol: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    timeframe?: string;
  }) => apiClient.post("/backtesting", data),

  getById: (id: string) => apiClient.get(`/backtesting/${id}`),

  getAll: () => apiClient.get("/backtesting"),

  delete: (id: string) => apiClient.delete(`/backtesting/${id}`),
};

// Crypto API
export const cryptoApi = {
  getAll: () => apiClient.get("/crypto"),

  getBySymbol: (symbol: string) => apiClient.get(`/crypto/${symbol}`),
};

// Watchlist API
export const watchlistApi = {
  getAll: () => apiClient.get("/watchlist"),

  add: (cryptoSymbol: string, notes?: string) =>
    apiClient.post("/watchlist", { cryptoSymbol, notes }),

  remove: (symbol: string) => apiClient.delete(`/watchlist/${symbol}`),

  update: (
    symbol: string,
    data: { notes?: string; alertOnBuy?: boolean; alertOnSell?: boolean },
  ) => apiClient.patch(`/watchlist/${symbol}`, data),

  check: (symbol: string) => apiClient.get(`/watchlist/check/${symbol}`),
};

// News API
export const newsApi = {
  getAll: (params?: {
    crypto?: string;
    sentiment?: "positive" | "negative" | "neutral";
    source?: string;
    limit?: number;
  }) => apiClient.get("/news", { params }),

  getTrending: () => apiClient.get("/news/trending"),

  getByCrypto: (symbol: string) => apiClient.get(`/news/crypto/${symbol}`),
};
