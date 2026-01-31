'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2, TrendingUp, Wifi, WifiOff } from 'lucide-react';

const publicRoutes = ['/login', '/register', '/'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, _hasHydrated } = useAuthStore();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Verificar conexión con backend
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3000/health', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        setBackendStatus(response.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Esperar hidratación de zustand
    if (!_hasHydrated) return;
    if (isLoading) return;

    // Si no hay usuario y no está en ruta pública, redirigir a login
    if (!user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }

    // Si hay usuario y está en login/register, redirigir a dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router, _hasHydrated]);

  // Splash screen mientras carga
  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          {/* Logo animado */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-emerald-500/20"></div>
            <div className="absolute h-20 w-20 animate-pulse rounded-full bg-emerald-500/30"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Título */}
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-white">
            CryptoBro
          </h1>
          <p className="mb-8 text-center text-sm text-slate-400">
            Señales de Trading Inteligentes
          </p>
          
          {/* Loading indicator */}
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <p className="text-sm text-slate-500">Iniciando aplicación...</p>
          </div>
          
          {/* Status del backend */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs">
            {backendStatus === 'checking' && (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></div>
                <span className="text-slate-500">Conectando al servidor...</span>
              </>
            )}
            {backendStatus === 'online' && (
              <>
                <Wifi className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">Servidor conectado</span>
              </>
            )}
            {backendStatus === 'offline' && (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-400">Servidor no disponible</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
