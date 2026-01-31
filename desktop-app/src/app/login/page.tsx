'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, TrendingUp, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('¡Bienvenido de vuelta!');
      } else {
        await register(formData.email, formData.password, formData.name);
        toast.success('¡Cuenta creada exitosamente!');
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CryptoBro</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Toma decisiones de trading
            <br />
            <span className="text-emerald-200">con inteligencia artificial</span>
          </h1>
          
          <p className="text-lg text-white/80 mb-8 max-w-md">
            Analiza el mercado crypto en tiempo real, recibe señales precisas y 
            maximiza tus oportunidades de trading.
          </p>
          
          <div className="space-y-4">
            {[
              { icon: '📊', text: 'Análisis técnico automatizado' },
              { icon: '🔔', text: 'Alertas en tiempo real' },
              { icon: '📱', text: 'Notificaciones por Telegram' },
              { icon: '🎯', text: 'Señales de compra/venta precisas' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <span className="text-xl">{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"></div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CryptoBro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta'}
            </h2>
            <p className="text-slate-400">
              {isLogin 
                ? 'Ingresa tus credenciales para continuar' 
                : 'Comienza a recibir señales de trading hoy'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-12 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10 h-12 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pl-10 h-12 border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-950 px-4 text-slate-500">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 w-full py-3 text-center text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isLogin ? 'Crear una cuenta nueva' : 'Iniciar sesión'}
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-3 w-3" />
            <span>Powered by AI Trading Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
}
