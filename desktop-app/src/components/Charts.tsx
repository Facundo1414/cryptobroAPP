'use client';

import { useState, useEffect, useRef } from 'react';

// ============================================
// LIGHTWEIGHT CANDLESTICK CHART
// ============================================

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  width?: number;
  height?: number;
  showVolume?: boolean;
  showGrid?: boolean;
  theme?: 'dark' | 'light';
  onCandleHover?: (candle: CandleData | null) => void;
}

export function CandlestickChart({
  data,
  width = 800,
  height = 400,
  showVolume = true,
  showGrid = true,
  theme = 'dark',
  onCandleHover,
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const colors = {
    dark: {
      background: '#1f2937',
      grid: '#374151',
      text: '#9ca3af',
      bullish: '#22c55e',
      bearish: '#ef4444',
      volume: '#3b82f6',
      crosshair: '#6b7280',
    },
    light: {
      background: '#ffffff',
      grid: '#e5e7eb',
      text: '#374151',
      bullish: '#16a34a',
      bearish: '#dc2626',
      volume: '#2563eb',
      crosshair: '#9ca3af',
    },
  };

  const c = colors[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions
    const padding = { top: 20, right: 60, bottom: showVolume ? 80 : 40, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = showVolume ? height - padding.top - padding.bottom - 60 : height - padding.top - padding.bottom;
    const volumeHeight = 50;

    // Calculate price range
    const prices = data.flatMap((d) => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.05;

    // Calculate volume range
    const volumes = data.map((d) => d.volume || 0);
    const maxVolume = Math.max(...volumes) || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 0.5;

      // Horizontal lines
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Price labels
        const price = maxPrice + pricePadding - ((priceRange + pricePadding * 2) / 5) * i;
        ctx.fillStyle = c.text;
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(price.toFixed(2), width - padding.right + 5, y + 4);
      }
    }

    // Draw candles
    const candleWidth = Math.max(1, (chartWidth / data.length) * 0.8);
    const gapWidth = (chartWidth / data.length) * 0.2;

    data.forEach((candle, i) => {
      const x = padding.left + i * (candleWidth + gapWidth) + gapWidth / 2;
      const isBullish = candle.close >= candle.open;
      const color = isBullish ? c.bullish : c.bearish;

      // Calculate Y positions
      const yHigh = padding.top + ((maxPrice + pricePadding - candle.high) / (priceRange + pricePadding * 2)) * chartHeight;
      const yLow = padding.top + ((maxPrice + pricePadding - candle.low) / (priceRange + pricePadding * 2)) * chartHeight;
      const yOpen = padding.top + ((maxPrice + pricePadding - candle.open) / (priceRange + pricePadding * 2)) * chartHeight;
      const yClose = padding.top + ((maxPrice + pricePadding - candle.close) / (priceRange + pricePadding * 2)) * chartHeight;

      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = color;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);

      // Draw volume
      if (showVolume && candle.volume) {
        const volumeY = height - padding.bottom + 10;
        const volHeight = (candle.volume / maxVolume) * volumeHeight;
        ctx.fillStyle = color + '60';
        ctx.fillRect(x, volumeY + volumeHeight - volHeight, candleWidth, volHeight);
      }
    });

    // Draw crosshair if hovering
    if (hoveredCandle && mousePos.x > 0) {
      ctx.strokeStyle = c.crosshair;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padding.top);
      ctx.lineTo(mousePos.x, height - padding.bottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, mousePos.y);
      ctx.lineTo(width - padding.right, mousePos.y);
      ctx.stroke();

      ctx.setLineDash([]);
    }
  }, [data, width, height, showVolume, showGrid, theme, hoveredCandle, mousePos, c]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Find which candle is being hovered
    const padding = { left: 10, right: 60 };
    const chartWidth = width - padding.left - padding.right;
    const candleWidth = chartWidth / data.length;
    const index = Math.floor((x - padding.left) / candleWidth);

    if (index >= 0 && index < data.length) {
      setHoveredCandle(data[index]);
      onCandleHover?.(data[index]);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    onCandleHover?.(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-lg cursor-crosshair"
      />
      {hoveredCandle && (
        <div
          className="absolute top-2 left-2 bg-gray-900/90 rounded-lg px-3 py-2 text-xs space-y-1"
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-gray-400">
            {new Date(hoveredCandle.time).toLocaleString()}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-500">O:</span>
            <span className="text-white">{hoveredCandle.open.toFixed(2)}</span>
            <span className="text-gray-500">H:</span>
            <span className="text-green-400">{hoveredCandle.high.toFixed(2)}</span>
            <span className="text-gray-500">L:</span>
            <span className="text-red-400">{hoveredCandle.low.toFixed(2)}</span>
            <span className="text-gray-500">C:</span>
            <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400'}>
              {hoveredCandle.close.toFixed(2)}
            </span>
            {hoveredCandle.volume && (
              <>
                <span className="text-gray-500">Vol:</span>
                <span className="text-blue-400">{hoveredCandle.volume.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// AREA CHART
// ============================================

interface AreaChartProps {
  data: { time: number; value: number }[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
}

export function AreaChart({
  data,
  width = 600,
  height = 200,
  color = '#3b82f6',
  fillOpacity = 0.3,
  showGrid = true,
  showTooltip = true,
  formatValue = (v) => v.toFixed(2),
}: AreaChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ time: number; value: number; x: number; y: number } | null>(null);

  if (data.length < 2) return null;

  const padding = { top: 10, right: 10, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const valuePadding = range * 0.1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + ((maxValue + valuePadding - d.value) / (range + valuePadding * 2)) * chartHeight;
    return { x, y, time: d.time, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
    if (index >= 0 && index < points.length) {
      setHoveredPoint(points[index]);
    }
  };

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        className="cursor-crosshair"
      >
        {/* Grid */}
        {showGrid && (
          <g className="text-gray-700">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartHeight * ratio;
              const value = maxValue + valuePadding - (range + valuePadding * 2) * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#374151"
                    strokeWidth="0.5"
                  />
                  <text x={padding.left - 5} y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">
                    {formatValue(value)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Area */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover point */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={height - padding.bottom}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill={color} stroke="white" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && showTooltip && (
        <div
          className="absolute bg-gray-900/95 rounded-lg px-3 py-2 text-xs pointer-events-none"
          style={{
            left: Math.min(hoveredPoint.x + 10, width - 120),
            top: hoveredPoint.y - 40,
          }}
        >
          <div className="text-gray-400">{new Date(hoveredPoint.time).toLocaleString()}</div>
          <div className="text-white font-medium">{formatValue(hoveredPoint.value)}</div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SIMPLE BAR CHART
// ============================================

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
}

export function BarChart({
  data,
  width = 400,
  height = 200,
  horizontal = false,
  showValues = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const padding = horizontal ? { top: 10, right: 40, bottom: 10, left: 80 } : { top: 10, right: 10, bottom: 40, left: 40 };

  if (horizontal) {
    const barHeight = Math.min(30, (height - padding.top - padding.bottom) / data.length - 4);

    return (
      <svg width={width} height={height}>
        {data.map((item, i) => {
          const barWidth = (item.value / maxValue) * (width - padding.left - padding.right);
          const y = padding.top + i * (barHeight + 4);

          return (
            <g key={item.label}>
              <text x={padding.left - 5} y={y + barHeight / 2 + 4} fill="#9ca3af" fontSize="11" textAnchor="end">
                {item.label}
              </text>
              <rect
                x={padding.left}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color || '#3b82f6'}
                rx="4"
                className="transition-all duration-300"
              />
              {showValues && (
                <text x={padding.left + barWidth + 5} y={y + barHeight / 2 + 4} fill="#ffffff" fontSize="11">
                  {item.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  const barWidth = Math.min(40, (width - padding.left - padding.right) / data.length - 8);

  return (
    <svg width={width} height={height}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - padding.top - padding.bottom);
        const x = padding.left + i * (barWidth + 8) + 4;
        const y = height - padding.bottom - barHeight;

        return (
          <g key={item.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={item.color || '#3b82f6'}
              rx="4"
              className="transition-all duration-300"
            />
            <text
              x={x + barWidth / 2}
              y={height - padding.bottom + 15}
              fill="#9ca3af"
              fontSize="10"
              textAnchor="middle"
            >
              {item.label}
            </text>
            {showValues && (
              <text x={x + barWidth / 2} y={y - 5} fill="#ffffff" fontSize="10" textAnchor="middle">
                {item.value.toLocaleString()}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================
// DONUT/PIE CHART
// ============================================

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  donut?: boolean;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function PieChart({
  data,
  size = 200,
  donut = true,
  showLegend = true,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 10;
  const innerRadius = donut ? radius * 0.6 : 0;
  const center = size / 2;

  let currentAngle = -Math.PI / 2;

  const slices = data.map((item) => {
    const angle = (item.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = center + Math.cos(startAngle) * radius;
    const y1 = center + Math.sin(startAngle) * radius;
    const x2 = center + Math.cos(endAngle) * radius;
    const y2 = center + Math.sin(endAngle) * radius;

    const ix1 = center + Math.cos(startAngle) * innerRadius;
    const iy1 = center + Math.sin(startAngle) * innerRadius;
    const ix2 = center + Math.cos(endAngle) * innerRadius;
    const iy2 = center + Math.sin(endAngle) * innerRadius;

    const largeArc = angle > Math.PI ? 1 : 0;

    const d = donut
      ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...item, d, percentage: ((item.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg width={size} height={size}>
          {slices.map((slice, i) => (
            <path
              key={slice.label}
              d={slice.d}
              fill={slice.color}
              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              style={{ transformOrigin: 'center' }}
            />
          ))}
        </svg>
        {donut && (centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-2xl font-bold text-white">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-gray-400">{centerLabel}</span>}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="space-y-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-sm text-gray-300">{slice.label}</span>
              <span className="text-sm text-gray-500">({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
