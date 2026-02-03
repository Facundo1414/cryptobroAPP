import { create } from "zustand";

interface Portfolio {
  id: string;
  userId: string;
  initialBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
}

interface PortfolioStats extends Portfolio {
  totalEquity: number;
  openPositions: number;
  unrealizedPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
}

interface PortfolioStore {
  portfolio: PortfolioStats | null;
  isLoading: boolean;
  error: string | null;
  fetchPortfolio: (accessToken: string) => Promise<void>;
  clearPortfolio: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  portfolio: null,
  isLoading: false,
  error: null,

  fetchPortfolio: async (accessToken: string) => {
    if (!accessToken) {
      set({ portfolio: null, isLoading: false, error: "No access token" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      // Try to fetch portfolio stats
      const response = await fetch(`${API_URL}/paper-trading/portfolio/stats`, {
        headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        set({ portfolio: data, isLoading: false });
      } else if (response.status === 404) {
        // User doesn't have a portfolio yet
        set({ portfolio: null, isLoading: false, error: null });
      } else {
        throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      set({
        portfolio: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  clearPortfolio: () => {
    set({ portfolio: null, isLoading: false, error: null });
  },
}));
