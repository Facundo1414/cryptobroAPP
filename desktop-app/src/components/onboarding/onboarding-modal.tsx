'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Bell, 
  BarChart3, 
  Shield, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Target,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  image?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: '¡Bienvenido a CryptoBro!',
    description: 'Tu asistente inteligente para trading de criptomonedas. Te ayudaremos a tomar mejores decisiones de inversión.',
    icon: <Sparkles className="h-12 w-12 text-emerald-400" />,
    features: [
      'Análisis técnico automatizado',
      'Señales de compra y venta',
      'Sin necesidad de ser experto',
    ],
  },
  {
    title: 'Señales de Trading',
    description: 'Recibe señales de BUY (compra) y SELL (venta) basadas en 3 estrategias probadas con win rates del 63-72%.',
    icon: <Target className="h-12 w-12 text-blue-400" />,
    features: [
      'RSI + Volume: Detecta sobreventa/sobrecompra',
      'EMA Ribbon: Sigue tendencias fuertes',
      'MACD + RSI: Confluencia de indicadores',
    ],
  },
  {
    title: 'Dashboard en Tiempo Real',
    description: 'Monitorea el mercado crypto con datos actualizados de Binance. Ve precios, volumen y tendencias al instante.',
    icon: <BarChart3 className="h-12 w-12 text-purple-400" />,
    features: [
      'Precios en tiempo real',
      'Gráficos interactivos',
      'Top gainers y losers',
    ],
  },
  {
    title: 'Alertas Personalizadas',
    description: 'Configura alertas de precio para que te avisemos cuando una crypto alcance tu objetivo.',
    icon: <Bell className="h-12 w-12 text-yellow-400" />,
    features: [
      'Alertas por precio objetivo',
      'Notificaciones en tiempo real',
      'Nunca pierdas una oportunidad',
    ],
  },
  {
    title: 'Gestión de Riesgo',
    description: 'Calcula el tamaño de posición ideal y configura Stop Loss / Take Profit para proteger tu capital.',
    icon: <Shield className="h-12 w-12 text-red-400" />,
    features: [
      'Calculadora de posición',
      'Stop Loss automático sugerido',
      'Take Profit con ratio 2:1',
    ],
  },
  {
    title: '¡Listo para comenzar!',
    description: 'Ya conoces las funciones principales. Recuerda: CryptoBro te asesora, pero las decisiones finales son tuyas.',
    icon: <Zap className="h-12 w-12 text-emerald-400" />,
    features: [
      '⚠️ Esto NO es consejo financiero',
      '📊 Investiga siempre por tu cuenta',
      '💰 Invierte solo lo que puedas perder',
    ],
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('cryptobro_onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Progress bar */}
          <div className="h-1 bg-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                {step.icon}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-slate-300 text-center mb-6 max-w-md mx-auto">
              {step.description}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {step.features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200">{feature}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              {/* Step indicators */}
              <div className="flex gap-2">
                {onboardingSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'w-6 bg-emerald-500' 
                        : index < currentStep
                          ? 'w-2 bg-emerald-500/50'
                          : 'w-2 bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                {isLastStep ? (
                  <>
                    ¡Empezar!
                    <Sparkles className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-8 pb-4">
            <p className="text-xs text-slate-500 text-center">
              Paso {currentStep + 1} de {onboardingSteps.length} • Presiona Esc o click fuera para saltar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para controlar el onboarding
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya completó el onboarding
    const completed = localStorage.getItem('cryptobro_onboarding_completed');
    if (!completed) {
      // Pequeño delay para que la UI se cargue primero
      setTimeout(() => setShowOnboarding(true), 500);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('cryptobro_onboarding_completed');
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    resetOnboarding,
    completeOnboarding,
  };
}
