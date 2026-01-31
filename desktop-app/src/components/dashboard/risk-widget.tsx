'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface RiskMetrics {
  portfolioRisk: number;
  openPositions: number;
  totalExposure: number;
  maxDrawdown: number;
  winRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function RiskWidget() {
  const { accessToken } = useAuthStore();
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated data - in production, fetch from API
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setMetrics({
          portfolioRisk: 3.5,
          openPositions: 4,
          totalExposure: 2500,
          maxDrawdown: 8.2,
          winRate: 62,
          riskLevel: 'MEDIUM',
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, [accessToken]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
      case 'MEDIUM': return { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
      case 'HIGH': return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
      case 'CRITICAL': return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      default: return { text: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-700 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-slate-700 rounded-lg" />
            <div className="h-16 bg-slate-700 rounded-lg" />
            <div className="h-16 bg-slate-700 rounded-lg" />
            <div className="h-16 bg-slate-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const riskColors = metrics ? getRiskColor(metrics.riskLevel) : getRiskColor('LOW');

  return (
    <div className={`rounded-2xl border ${riskColors.border} bg-slate-900/50 p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${riskColors.bg} flex items-center justify-center`}>
            <Shield className={`w-4 h-4 ${riskColors.text}`} />
          </div>
          <h3 className="font-semibold text-white">Risk Overview</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${riskColors.bg} ${riskColors.text} font-medium`}>
          {metrics?.riskLevel || 'N/A'}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Activity className="w-3 h-3" />
            Portfolio Risk
          </div>
          <p className={`text-lg font-bold ${riskColors.text}`}>
            {metrics?.portfolioRisk.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Target className="w-3 h-3" />
            Open Positions
          </div>
          <p className="text-lg font-bold text-white">
            {metrics?.openPositions}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <TrendingDown className="w-3 h-3" />
            Max Drawdown
          </div>
          <p className="text-lg font-bold text-red-400">
            -{metrics?.maxDrawdown.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Win Rate
          </div>
          <p className="text-lg font-bold text-green-400">
            {metrics?.winRate}%
          </p>
        </div>
      </div>

      {/* Risk Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Risk Exposure</span>
          <span>${metrics?.totalExposure.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${riskColors.bg.replace('/20', '')} transition-all duration-500`}
            style={{ width: `${Math.min((metrics?.portfolioRisk || 0) * 10, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning if high risk */}
      {metrics && (metrics.riskLevel === 'HIGH' || metrics.riskLevel === 'CRITICAL') && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-300">
              Your portfolio risk is elevated. Consider reducing position sizes or adding stop losses.
            </p>
          </div>
        </div>
      )}

      {/* Link to full risk management */}
      <Link 
        href="/risk-management"
        className="flex items-center justify-between w-full px-3 py-2 bg-slate-800/50 
                   hover:bg-slate-700/50 rounded-lg transition-colors group"
      >
        <span className="text-sm text-slate-300 group-hover:text-white">
          Risk Management Tools
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
      </Link>
    </div>
  );
}
