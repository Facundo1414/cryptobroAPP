import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authApi } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      login: async (email, password) => {
        try {
          const response = await authApi.login(email, password);
          const { user, tokens } = response as any;

          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          console.error("Login failed:", error);
          throw error;
        }
      },

      register: async (email, password, name) => {
        try {
          const response = await authApi.register(email, password, name);
          const { user, tokens } = response as any;

          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
        } catch (error) {
          console.error("Registration failed:", error);
          throw error;
        }
      },

      logout: () => {
        try {
          authApi.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },

      checkAuth: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const user = await authApi.getProfile();
          set({ user: user as any, isLoading: false });
        } catch (error) {
          console.error("Auth check failed:", error);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
