'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { CryptoListWidget } from '@/components/dashboard/crypto-list-widget';
import { TradingChart } from '@/components/dashboard/trading-chart';
import { RecentSignalsWidget } from '@/components/dashboard/recent-signals-widget';
import { AlertsWidget } from '@/components/dashboard/alerts-widget';
import { MarketStats } from '@/components/dashboard/market-stats';
import { WatchlistWidget } from '@/components/watchlist/watchlist-widget';
import { RiskWidget } from '@/components/dashboard/risk-widget';
import { OnboardingModal, useOnboarding } from '@/components/onboarding';
import { useAuthStore } from '@/stores/auth-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { useMarketDataStore } from '@/stores/market-data-store';
import { useTranslation } from '@/hooks/useTranslation';
import { signalsApi } from '@/lib/api-client';
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Shield, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
  const router = useRouter();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { accessToken, user } = useAuthStore();
  const { portfolio, fetchPortfolio } = usePortfolioStore();
  const { prices } = useMarketDataStore();
  const { t } = useTranslation();
  const [signalsData, setSignalsData] = useState<{ count: number; newCount: number } | null>(null);

  // Fetch portfolio data when user is authenticated
  useEffect(() => {
    if (user && accessToken) {
      fetchPortfolio(accessToken);
    }
  }, [user, accessToken, fetchPortfolio]);

  // Fetch active signals count
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await signalsApi.getActiveCount(24) as any;
        setSignalsData(response.data || response);
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };
    fetchSignals();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSignals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate values from portfolio or use defaults
  const portfolioValue = portfolio?.totalEquity 
    ? `$${portfolio.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';
  
  const dailyChange = portfolio?.dailyPnl 
    ? `${portfolio.dailyPnl >= 0 ? '+' : ''}${portfolio.dailyPnl.toFixed(2)}% ${t('dashboard.today')}`
    : t('dashboard.noData');
  
  const portfolioTrend = portfolio?.dailyPnl 
    ? (portfolio.dailyPnl >= 0 ? 'up' : 'down')
    : 'neutral';

  const monthlyPnl = portfolio?.monthlyPnl
    ? `${portfolio.monthlyPnl >= 0 ? '+' : ''}${portfolio.monthlyPnl.toFixed(1)}%`
    : 'N/A';
  
  const monthlyChange = portfolio?.monthlyPnl && portfolio?.weeklyPnl
    ? t('dashboard.vsPrevWeek', { 
        value: `${portfolio.weeklyPnl >= 0 ? '+' : ''}${portfolio.weeklyPnl.toFixed(1)}%` 
      })
    : t('dashboard.noHistoricalData');
  
  const monthlyTrend = portfolio?.monthlyPnl
    ? (portfolio.monthlyPnl >= 0 ? 'up' : 'down')
    : 'neutral';

  // Get BTC price from market data store
  const btcData = prices.get('BTCUSDT');
  const btcValue = btcData 
    ? `$${btcData.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : t('common.loading');
  const btcChange = btcData
    ? `${btcData.change24h >= 0 ? '+' : ''}${btcData.change24h.toFixed(1)}% 24h`
    : t('dashboard.noData');
  const btcTrend = btcData && btcData.change24h >= 0 ? 'up' : 'down';
  
  // Get active signals from API
  const activeSignals = signalsData?.count?.toString() || '0';
  const newSignals = signalsData?.newCount ? `${signalsData.newCount} ${t('dashboard.newSignals')}` : t('dashboard.noData');

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
            <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
            <p className="mt-1 text-slate-400">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/dashboard/smart-money')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            >
              <Zap className="h-4 w-4 mr-2" />
              Smart Money Analysis
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-emerald-400">{t('dashboard.marketOpen')}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStat 
            title={t('dashboard.portfolioValue')}
            value={portfolioValue}
            change={dailyChange}
            icon={DollarSign}
            trend={portfolioTrend}
          />
          <QuickStat 
            title={t('dashboard.activeSignals')}
            value={activeSignals}
            change={newSignals}
            icon={Activity}
            trend="neutral"
          />
          <QuickStat 
            title={t('dashboard.monthlyGain')}
            value={monthlyPnl}
            change={monthlyChange}
            icon={TrendingUp}
            trend={monthlyTrend}
          />
          <QuickStat 
            title={t('dashboard.bitcoin')}
            value={btcValue}
            change={btcChange}
            icon={TrendingDown}
            trend={btcTrend}
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
