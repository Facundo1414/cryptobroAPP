'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/providers/auth-provider';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { InstallPWA } from '@/components/pwa/install-pwa';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <WebSocketProvider>
          <AuthGuard>
            {children}
            <InstallPWA />
          </AuthGuard>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
