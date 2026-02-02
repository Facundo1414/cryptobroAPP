'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Palette, 
  Key, 
  Shield, 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Save,
  Lock,
  Trash2,
  ExternalLink,
  HelpCircle,
  PlayCircle,
  MessageCircle,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { NotificationService } from '@/lib/notification-service';
import { Tabs } from '@/components/ui';
import { NotificationSettings as PWANotificationSettings } from '@/components/pwa/pwa-manager';
import { VersionDisplay } from '@/components/updates';

interface Settings {
  notifications: {
    signals: boolean;
    alerts: boolean;
    news: boolean;
    soundEnabled: boolean;
  };
  theme: 'dark' | 'light';
  apiKeys: {
    binance: string;
    newsApi: string;
  };
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { theme: currentTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      signals: true,
      alerts: true,
      news: false,
      soundEnabled: true,
    },
    theme: 'dark',
    apiKeys: {
      binance: '',
      newsApi: '',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync theme state with next-themes
  useEffect(() => {
    if (currentTheme) {
      setSettings(prev => ({ ...prev, theme: currentTheme as 'dark' | 'light' }));
    }
  }, [currentTheme]);

  const loadSettings = () => {
    const stored = localStorage.getItem('user-settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  };

  const saveSettings = (newSettings: Settings) => {
    localStorage.setItem('user-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    toast.success('Configuración guardada');
  };

  const handleNotificationToggle = (key: keyof Settings['notifications']) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    saveSettings(newSettings);
    
    // Update notification service
    if (key === 'soundEnabled') {
      NotificationService.setSoundEnabled(newSettings.notifications.soundEnabled);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    const newSettings = { ...settings, theme: newTheme };
    saveSettings(newSettings);
    // Apply theme using next-themes
    setTheme(newTheme);
    toast.success(`Tema cambiado a ${newTheme === 'dark' ? 'Oscuro' : 'Claro'}`);
  };

  const handleApiKeyUpdate = (key: keyof Settings['apiKeys'], value: string) => {
    setSettings({
      ...settings,
      apiKeys: {
        ...settings.apiKeys,
        [key]: value,
      },
    });
  };

  const handleSaveApiKeys = () => {
    saveSettings(settings);
  };

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Section Card Component
  const SectionCard = ({ 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    icon: any; 
    title: string; 
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-gray-400" />
              </div>
              Configuración
            </h1>
            <p className="text-gray-400 mt-2">
              Administra tu cuenta y preferencias de la aplicación
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'profile', label: 'Perfil' },
            { id: 'notifications', label: 'Notificaciones' },
            { id: 'appearance', label: 'Apariencia' },
            { id: 'api-keys', label: 'Claves API' },
            { id: 'security', label: 'Seguridad' },
            { id: 'updates', label: 'Actualizaciones' },
            { id: 'help', label: 'Ayuda' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Profile Section */}
        {activeTab === 'profile' && (
          <SectionCard icon={User} title="Información del Perfil" description="Detalles de tu cuenta">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                                flex items-center justify-center text-2xl font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-white">{user?.email || 'No has iniciado sesión'}</p>
                  <p className="text-sm text-gray-500">ID: {user?.id || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Correo</label>
                  <input 
                    type="text"
                    value={user?.email || 'No has iniciado sesión'} 
                    disabled 
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Cuenta Creada</label>
                  <input 
                    type="text"
                    value={(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'N/A'} 
                    disabled 
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg
                               text-white disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <SectionCard icon={Bell} title="Preferencias de Notificaciones" description="Configura cómo recibir actualizaciones">
            <div className="space-y-1">
              {/* PWA Push Notifications */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Notificaciones Push</h4>
                <PWANotificationSettings />
              </div>

              <h4 className="text-sm font-medium text-gray-400 mb-3">Notificaciones en la App</h4>
              
              <div className="flex items-center justify-between py-4 hover:bg-gray-700/30 rounded-lg px-3 -mx-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Señales de Trading</p>
                    <p className="text-sm text-gray-500">Recibe notificaciones cuando se generen nuevas señales</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.signals}
                  onChange={() => handleNotificationToggle('signals')}
                />
              </div>

              <div className="flex items-center justify-between py-4 hover:bg-gray-700/30 rounded-lg px-3 -mx-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Alertas de Precio</p>
                    <p className="text-sm text-gray-500">Recibe notificaciones cuando se activen alertas de precio</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.alerts}
                  onChange={() => handleNotificationToggle('alerts')}
                />
              </div>

              <div className="flex items-center justify-between py-4 hover:bg-gray-700/30 rounded-lg px-3 -mx-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Actualizaciones de Noticias</p>
                    <p className="text-sm text-gray-500">Recibe notificaciones sobre noticias crypto importantes</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.news}
                  onChange={() => handleNotificationToggle('news')}
                />
              </div>

              <div className="flex items-center justify-between py-4 hover:bg-gray-700/30 rounded-lg px-3 -mx-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    {settings.notifications.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">Alertas de Sonido</p>
                    <p className="text-sm text-gray-500">Reproducir sonido cuando lleguen notificaciones</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.soundEnabled}
                  onChange={() => handleNotificationToggle('soundEnabled')}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Appearance */}
        {activeTab === 'appearance' && (
          <SectionCard icon={Palette} title="Apariencia" description="Personaliza cómo se ve la app">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-3 block">Tema</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-blue-500 bg-gray-700/50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full h-24 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Moon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white">Oscuro</p>
                      <p className="text-xs text-gray-500">Tema por defecto</p>
                    </div>
                  </div>
                  {settings.theme === 'dark' && (
                    <div className="mt-2 text-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        Activo
                      </span>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-blue-500 bg-gray-700/50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Sun className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white">Claro</p>
                      <p className="text-xs text-gray-500">Tema claro</p>
                    </div>
                  </div>
                  {settings.theme === 'light' && (
                    <div className="mt-2 text-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        Activo
                      </span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {/* API Keys */}
        {activeTab === 'api-keys' && (
          <SectionCard icon={Key} title="Claves API" description="Conecta servicios externos (opcional)">
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-400">
                  <strong>ℹ️ Estas claves son opcionales.</strong> La app funciona sin ellas usando APIs públicas gratuitas.
                  Solo agrégalas si necesitas funciones avanzadas.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Clave API de Binance</label>
                  <a href="https://www.binance.com/en/my/settings/api-management" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    Obtener Clave <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Ingresa tu clave API de Binance"
                  value={settings.apiKeys.binance}
                  onChange={(e) => handleApiKeyUpdate('binance', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg
                             text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  🟢 <strong>Sin clave:</strong> Datos de mercado públicos (precios, gráficos, señales) funcionan perfectamente.<br/>
                  🔵 <strong>Con clave:</strong> Acceso a tu balance y órdenes (solo lectura recomendado).
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Clave API de Noticias</label>
                  <a href="https://cryptopanic.com/developers/api/" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    Obtener Clave (Opcional) <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Ingresa tu clave API de noticias (opcional)"
                  value={settings.apiKeys.newsApi}
                  onChange={(e) => handleApiKeyUpdate('newsApi', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg
                             text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  🟢 <strong>Sin clave:</strong> Noticias de CryptoPanic (públicas) y CoinGecko trending.<br/>
                  🔵 <strong>Con clave:</strong> Más noticias y filtros avanzados.
                </p>
              </div>

              <button 
                onClick={handleSaveApiKeys} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                           bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                           font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar Claves API
              </button>
            </div>
          </SectionCard>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <SectionCard icon={Shield} title="Seguridad" description="Protege tu cuenta">
            <div className="space-y-4">
              <button 
                className="w-full flex items-center justify-between px-4 py-3 
                           bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors
                           border border-gray-700 text-left group"
                disabled
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-400">Cambiar Contraseña</p>
                    <p className="text-xs text-gray-500">Actualiza tu contraseña regularmente</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400">
                  Próximamente
                </span>
              </button>

              <button 
                className="w-full flex items-center justify-between px-4 py-3 
                           bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors
                           border border-gray-700 text-left group"
                disabled
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-400">Autenticación de Dos Factores</p>
                    <p className="text-xs text-gray-500">Añade una capa extra de seguridad</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400">
                  Próximamente
                </span>
              </button>

              <div className="pt-4 border-t border-gray-700">
                <button 
                  className="w-full flex items-center justify-between px-4 py-3 
                             bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors
                             border border-red-500/30 text-left"
                  disabled
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-medium text-red-400">Eliminar Cuenta</p>
                      <p className="text-xs text-red-400/70">Eliminar permanentemente tu cuenta y datos</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                    Próximamente
                  </span>
                </button>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Updates Section */}
        {activeTab === 'updates' && (
          <SectionCard icon={Download} title="Actualizaciones" description="Mantén tu app actualizada">
            <VersionDisplay />
          </SectionCard>
        )}

        {/* Help Section */}
        {activeTab === 'help' && (
          <SectionCard icon={HelpCircle} title="Ayuda y Soporte" description="Aprende a usar CryptoBro">
            <div className="space-y-4">
              {/* Quick Start Guide */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/30">
                <h4 className="font-medium text-emerald-400 mb-2">🚀 ¿Qué puedo hacer con CryptoBro?</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li><strong>📊 Dashboard:</strong> Ver precios de criptomonedas en tiempo real</li>
                  <li><strong>🎯 Señales:</strong> Recibir recomendaciones de compra/venta automáticas</li>
                  <li><strong>🔔 Alertas:</strong> Configurar notificaciones cuando una crypto alcance tu precio objetivo</li>
                  <li><strong>📰 Noticias:</strong> Estar al día con las últimas noticias del mercado</li>
                  <li><strong>📈 Backtesting:</strong> Probar estrategias con datos históricos</li>
                  <li><strong>🛡️ Riesgo:</strong> Calcular el tamaño ideal de tus posiciones</li>
                </ul>
              </div>

              {/* Tutorial Button */}
              <button 
                onClick={() => {
                  // Reset onboarding flag and navigate to dashboard
                  localStorage.removeItem('cryptobro_onboarding_completed');
                  toast.success('Tutorial reiniciado. Redirigiendo al dashboard...');
                  router.push('/dashboard');
                }}
                className="w-full flex items-center justify-between px-4 py-3 
                           bg-gradient-to-r from-cyan-500/10 to-purple-500/10 
                           hover:from-cyan-500/20 hover:to-purple-500/20 
                           rounded-lg transition-all border border-cyan-500/30 text-left group"
              >
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium text-white">Ver Tutorial Interactivo</p>
                    <p className="text-xs text-gray-400">Recorrido guiado por todas las funciones</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">
                  6 pasos
                </span>
              </button>

              {/* FAQ Section */}
              <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="font-medium text-white">❓ Preguntas Frecuentes</h4>
                <div className="space-y-2 text-sm">
                  <details className="group">
                    <summary className="cursor-pointer text-gray-300 hover:text-white">¿Necesito una cuenta de Binance?</summary>
                    <p className="mt-2 text-gray-400 pl-4">No. Los datos de mercado son públicos. Solo necesitas cuenta si quieres ver tu balance.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer text-gray-300 hover:text-white">¿Las señales son 100% precisas?</summary>
                    <p className="mt-2 text-gray-400 pl-4">No. Las señales tienen un win rate de 63-72%. Siempre investiga por tu cuenta antes de invertir.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer text-gray-300 hover:text-white">¿De dónde vienen las noticias?</summary>
                    <p className="mt-2 text-gray-400 pl-4">Usamos CryptoPanic (API pública) y CoinGecko trending. Son fuentes gratuitas y confiables.</p>
                  </details>
                </div>
              </div>

              {/* Contact Support */}
              <button 
                className="w-full flex items-center justify-between px-4 py-3 
                           bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors
                           border border-gray-700 text-left group"
                onClick={() => window.open('https://github.com/Facundo1414/cryptobroAPP/issues', '_blank')}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium text-white">Reportar Problema</p>
                    <p className="text-xs text-gray-400">Abre un issue en GitHub para soporte</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </button>

              {/* App Info */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="text-center text-gray-400 text-sm">
                  <p className="font-medium text-white mb-1">CryptoBro</p>
                  <p className="text-xs">Tu asistente inteligente de trading de criptomonedas</p>
                  <p className="text-xs mt-2">⚠️ Esto NO es consejo financiero. Invierte solo lo que puedas perder.</p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </DashboardLayout>
  );
}
