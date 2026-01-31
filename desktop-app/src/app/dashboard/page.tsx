'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { CryptoListWidget } from '@/components/dashboard/crypto-list-widget';
import { TradingChart } from '@/components/dashboard/trading-chart';
import { RecentSignalsWidget } from '@/components/dashboard/recent-signals-widget';
import { AlertsWidget } from '@/components/dashboard/alerts-widget';
import { MarketStats } from '@/components/dashboard/market-stats';
import { WatchlistWidget } from '@/components/watchlist/watchlist-widget';
import { RiskWidget } from '@/components/dashboard/risk-widget';
import { OnboardingModal, useOnboarding } from '@/components/onboarding';
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Shield } from 'lucide-react';

// Quick stats component
function QuickStat({ title, value, change, icon: Icon, trend }: { 
  title: string; 
  value: string; 
  change: string; 
  icon: any;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : 
             trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> : null}
            {change}
          </div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          trend === 'up' ? 'bg-emerald-500/10' : 
          trend === 'down' ? 'bg-red-500/10' : 'bg-slate-800'
        }`}>
          <Icon className={`h-6 w-6 ${
            trend === 'up' ? 'text-emerald-400' : 
            trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`} />
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
    </div>
  );
}

export default function DashboardPage() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <DashboardLayout>
      {/* Tutorial/Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={completeOnboarding} 
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-slate-400">
              Monitorea el mercado y recibe señales de trading en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-emerald-400">Mercado Abierto</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStat 
            title="Valor del Portafolio" 
            value="$12,458.32" 
            change="+5.2% hoy" 
            icon={DollarSign}
            trend="up"
          />
          <QuickStat 
            title="Señales Activas" 
            value="8" 
            change="3 nuevas" 
            icon={Activity}
            trend="neutral"
          />
          <QuickStat 
            title="Ganancia del Mes" 
            value="+18.4%" 
            change="vs +12.1% mes anterior" 
            icon={TrendingUp}
            trend="up"
          />
          <QuickStat 
            title="Bitcoin" 
            value="$43,256" 
            change="-2.1% 24h" 
            icon={TrendingDown}
            trend="down"
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column - Top Cryptos */}
          <div className="lg:col-span-3">
            <CryptoListWidget />
          </div>

          {/* Center Column - Trading Chart */}
          <div className="lg:col-span-6">
            <TradingChart />
          </div>

          {/* Right Column - Watchlist, Signals & Risk */}
          <div className="lg:col-span-3 space-y-6">
            <WatchlistWidget />
            <RiskWidget />
            <RecentSignalsWidget />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AlertsWidget />
          </div>
          <div>
            <MarketStats />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
