'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/lib/hooks/usePWA';
import { 
  Bell, 
  BellOff, 
  Download, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  X,
  Smartphone 
} from 'lucide-react';

export function PWAManager() {
  const {
    isSupported,
    isInstalled,
    isOnline,
    notificationPermission,
    updateAvailable,
    installPromptAvailable,
    requestNotifications,
    promptInstall,
    refreshApp,
  } = usePWA();

  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'install' | 'update' | 'offline' | null>(null);

  // Show appropriate banner
  useEffect(() => {
    if (!isOnline) {
      setBannerType('offline');
      setShowBanner(true);
    } else if (updateAvailable) {
      setBannerType('update');
      setShowBanner(true);
    } else if (installPromptAvailable && !isInstalled) {
      setBannerType('install');
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, updateAvailable, installPromptAvailable, isInstalled]);

  if (!isSupported || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {bannerType === 'offline' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <WifiOff className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-yellow-400">Sin conexión</h4>
                <p className="text-sm text-yellow-400/70 mt-1">
                  Estás trabajando en modo offline. Algunos datos pueden no estar actualizados.
                </p>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="text-yellow-400/70 hover:text-yellow-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {bannerType === 'update' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-400">Actualización disponible</h4>
                <p className="text-sm text-blue-400/70 mt-1">
                  Hay una nueva versión disponible. Actualiza para obtener las últimas mejoras.
                </p>
                <button
                  onClick={refreshApp}
                  className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Actualizar ahora
                </button>
              </div>
              <button 
                onClick={() => setShowBanner(false)}
                className="text-blue-400/70 hover:text-blue-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install PWA Banner */}
      {bannerType === 'install' && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Smartphone className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-purple-400">Instalar CryptoBro</h4>
                <p className="text-sm text-purple-400/70 mt-1">
                  Instala la app para acceso rápido y notificaciones de señales en tiempo real.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={promptInstall}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Instalar
                  </button>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Notification Settings Component
export function NotificationSettings() {
  const {
    isSupported,
    notificationPermission,
    requestNotifications,
    showNotification,
  } = usePWA();

  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setLoading(true);
    const granted = await requestNotifications();
    setLoading(false);

    if (granted) {
      // Send test notification
      await showNotification(
        '🎉 Notificaciones activadas',
        'Recibirás alertas de señales de trading en tiempo real.'
      );
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            <BellOff className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h4 className="font-medium text-white">Notificaciones no disponibles</h4>
            <p className="text-sm text-gray-400">
              Tu navegador no soporta notificaciones push.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notificationPermission === 'granted') {
    const handleTestNotification = async () => {
      try {
        await showNotification('🔔 Test', 'Las notificaciones funcionan correctamente.');
      } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback: use browser notification directly
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 Test', { body: 'Las notificaciones funcionan correctamente.' });
        }
      }
    };

    return (
      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-green-400">Notificaciones activadas</h4>
            <p className="text-sm text-green-400/70">
              Recibirás alertas de señales de trading automáticamente.
            </p>
          </div>
          <button
            onClick={handleTestNotification}
            className="px-3 py-1.5 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
          >
            Probar
          </button>
        </div>
      </div>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <BellOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="font-medium text-red-400">Notificaciones bloqueadas</h4>
            <p className="text-sm text-red-400/70">
              Has bloqueado las notificaciones. Para activarlas, cambia los permisos en la configuración de tu navegador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white">Activar notificaciones</h4>
          <p className="text-sm text-gray-400">
            Recibe alertas de señales de trading en tiempo real, incluso cuando no estés usando la app.
          </p>
        </div>
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          Activar
        </button>
      </div>
    </div>
  );
}

// Online Status Indicator
export function OnlineStatus() {
  const { isOnline } = usePWA();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isOnline 
        ? 'bg-green-500/10 text-green-400' 
        : 'bg-yellow-500/10 text-yellow-400'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
