'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface OrderBlock {
  time: number;
  low: number;
  high: number;
  type: 'bullish' | 'bearish';
  strength: number;
}

interface FairValueGap {
  time: number;
  low: number;
  high: number;
  type: 'bullish' | 'bearish';
}

interface LiquiditySweep {
  time: number;
  price: number;
  type: 'bullish' | 'bearish';
}

interface SmartMoneyData {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquiditySweeps: LiquiditySweep[];
  structureChange?: {
    type: 'CHoCH' | 'BoS';
    direction: 'bullish' | 'bearish';
    time: number;
  };
  poc?: number;
  valueAreaHigh?: number;
  valueAreaLow?: number;
}

interface SmartMoneyChartProps {
  symbol?: string;
  data?: any;
  candles?: CandlestickData[];
  smartMoneyData?: SmartMoneyData;
  showOrderBlocks?: boolean;
  showFVGs?: boolean;
  showLiquiditySweeps?: boolean;
  showVolumeProfile?: boolean;
  onTimeRangeChange?: (from: number, to: number) => void;
}

export function SmartMoneyChart({ 
  symbol = 'Unknown', 
  data,
  candles: candlesProp, 
  smartMoneyData: smartMoneyDataProp,
  showOrderBlocks: showOBProp,
  showFVGs: showFVGProp,
  showLiquiditySweeps: showSweepsProp,
  showVolumeProfile: showVolProp,
  onTimeRangeChange 
}: SmartMoneyChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  // Extract data from unified data prop or use individual props
  const candles = data?.candles || candlesProp || [];
  const smartMoneyData = data?.metadata || smartMoneyDataProp;
  
  const [showOrderBlocks, setShowOrderBlocks] = useState(showOBProp !== undefined ? showOBProp : true);
  const [showFVGs, setShowFVGs] = useState(showFVGProp !== undefined ? showFVGProp : true);
  const [showSweeps, setShowSweeps] = useState(showSweepsProp !== undefined ? showSweepsProp : true);
  const [showPOC, setShowPOC] = useState(showVolProp !== undefined ? showVolProp : true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;

    // Set data
    if (candles && candles.length > 0) {
      candleSeries.setData(candles);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles]);

  // Draw Smart Money overlays
  useEffect(() => {
    if (!chartRef.current || !smartMoneyData) return;

    const chart = chartRef.current;

    // Clear previous markers and shapes
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setMarkers([]);
    }

    const markers: any[] = [];

    // Draw Order Blocks
    if (showOrderBlocks && smartMoneyData.orderBlocks) {
      smartMoneyData.orderBlocks.forEach((ob: any) => {
        // Add marker at order block location
        markers.push({
          time: ob.time as UTCTimestamp,
          position: ob.type === 'bullish' ? 'belowBar' : 'aboveBar',
          color: ob.type === 'bullish' ? '#10b981' : '#ef4444',
          shape: 'square',
          text: `${ob.type === 'bullish' ? '🟢' : '🔴'} OB ${ob.strength}%`,
        });

        // Draw rectangle (using series with filled area)
        // Note: lightweight-charts doesn't support rectangles directly
        // We'll use markers and tooltips
      });
    }

    // Draw Liquidity Sweeps
    if (showSweeps && smartMoneyData.liquiditySweeps) {
      smartMoneyData.liquiditySweeps.forEach((sweep: any) => {
        markers.push({
          time: sweep.time as UTCTimestamp,
          position: sweep.type === 'bullish' ? 'belowBar' : 'aboveBar',
          color: '#3b82f6',
          shape: 'arrowUp',
          text: `💧 Sweep $${sweep.price.toLocaleString()}`,
        });
      });
    }

    // Draw Structure Changes
    if (smartMoneyData.structureChange) {
      const { type, direction, time } = smartMoneyData.structureChange;
      markers.push({
        time: time as UTCTimestamp,
        position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
        color: type === 'CHoCH' ? '#f97316' : '#facc15',
        shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
        text: `${type === 'CHoCH' ? '🔄' : '⚡'} ${type}`,
      });
    }

    // Set all markers
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setMarkers(markers);
    }

    // Draw POC line
    if (showPOC && smartMoneyData.poc && candleSeriesRef.current) {
      // Add a line series for POC
      const pocLine = chart.addLineSeries({
        color: '#facc15',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: 'POC',
      });

      // Create horizontal line data
      if (candles.length > 0) {
        const pocData = [
          { time: candles[0].time, value: smartMoneyData.poc },
          { time: candles[candles.length - 1].time, value: smartMoneyData.poc },
        ];
        pocLine.setData(pocData);
      }
    }

    // Draw Value Area
    if (showPOC && smartMoneyData.valueAreaHigh && smartMoneyData.valueAreaLow) {
      // Add lines for value area
      const vaHighLine = chart.addLineSeries({
        color: '#64748b',
        lineWidth: 1,
        lineStyle: 1,
        title: 'VA High',
      });

      const vaLowLine = chart.addLineSeries({
        color: '#64748b',
        lineWidth: 1,
        lineStyle: 1,
        title: 'VA Low',
      });

      if (candles.length > 0) {
        vaHighLine.setData([
          { time: candles[0].time, value: smartMoneyData.valueAreaHigh },
          { time: candles[candles.length - 1].time, value: smartMoneyData.valueAreaHigh },
        ]);
        vaLowLine.setData([
          { time: candles[0].time, value: smartMoneyData.valueAreaLow },
          { time: candles[candles.length - 1].time, value: smartMoneyData.valueAreaLow },
        ]);
      }
    }

  }, [smartMoneyData, showOrderBlocks, showFVGs, showSweeps, showPOC, candles]);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {symbol}
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Smart Money View
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrderBlocks(!showOrderBlocks)}
              className={`px-2 py-1 text-xs rounded ${
                showOrderBlocks
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showOrderBlocks ? '🟢' : '⚪'} Order Blocks
            </button>
            <button
              onClick={() => setShowFVGs(!showFVGs)}
              className={`px-2 py-1 text-xs rounded ${
                showFVGs
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showFVGs ? '📈' : '⚪'} FVGs
            </button>
            <button
              onClick={() => setShowSweeps(!showSweeps)}
              className={`px-2 py-1 text-xs rounded ${
                showSweeps
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showSweeps ? '💧' : '⚪'} Sweeps
            </button>
            <button
              onClick={() => setShowPOC(!showPOC)}
              className={`px-2 py-1 text-xs rounded ${
                showPOC
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showPOC ? '🎯' : '⚪'} POC
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          )}
          <div ref={chartContainerRef} className="w-full" />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Bullish Order Block</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Bearish Order Block</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>💧 Liquidity Sweep</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>🎯 Point of Control</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>🔄 CHoCH</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span>⚡ BoS</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
