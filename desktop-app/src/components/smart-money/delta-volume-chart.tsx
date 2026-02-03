'use client';/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DeltaVolumeData {
  time: number;
  delta: number;
  buyVolume: number;
  sellVolume: number;
  timestamp: string;
}

interface DeltaVolumeChartProps {
  data: DeltaVolumeData[];
  height?: number;
}

export function DeltaVolumeChart({ data, height = 200 }: DeltaVolumeChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 800;
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d, i) => i.toString()))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => Math.min(0, d.delta)) || 0,
        d3.max(data, (d) => Math.max(0, d.delta)) || 0,
      ])
      .range([innerHeight, 0])
      .nice();

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Bars
    const tooltip = d3.select(tooltipRef.current);

    g.selectAll('.delta-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'delta-bar')
      .attr('x', (d, i) => xScale(i.toString()) || 0)
      .attr('y', (d) => (d.delta >= 0 ? yScale(d.delta) : yScale(0)))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => Math.abs(yScale(d.delta) - yScale(0)))
      .attr('fill', (d) => (d.delta >= 0 ? '#10b981' : '#ef4444'))
      .attr('opacity', 0.8)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('opacity', 1);
        
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 40}px`)
          .html(`
            <div class="text-xs">
              <div class="font-bold">${d.timestamp}</div>
              <div class="text-${d.delta >= 0 ? 'green' : 'red'}-400">
                Delta: ${d.delta >= 0 ? '+' : ''}${d.delta.toLocaleString()}
              </div>
              <div class="text-green-400">Buy: ${d.buyVolume.toLocaleString()}</div>
              <div class="text-red-400">Sell: ${d.sellVolume.toLocaleString()}</div>
            </div>
          `);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.8);
        tooltip.style('opacity', 0);
      });

    // X Axis - Show every nth label to avoid crowding
    const tickInterval = Math.ceil(data.length / 10);
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(
        data
          .map((d, i) => (i % tickInterval === 0 ? i.toString() : null))
          .filter((d) => d !== null) as string[]
      )
      .tickFormat((d, i) => {
        const index = parseInt(d);
        return data[index]?.timestamp.split(' ')[1] || '';
      });

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${yScale(0)})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => {
      const val = d as number;
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
      return val.toString();
    });

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px');

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .text('Delta Volume');

  }, [data, height]);

  // Calculate total delta
  const totalDelta = data.reduce((sum, d) => sum + d.delta, 0);
  const totalBuy = data.reduce((sum, d) => sum + d.buyVolume, 0);
  const totalSell = data.reduce((sum, d) => sum + d.sellVolume, 0);
  const deltaPercent = totalBuy + totalSell > 0 
    ? ((Math.abs(totalDelta) / (totalBuy + totalSell)) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white">Delta Volume (Order Flow)</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Delta</div>
              <div className={`text-sm font-bold ${totalDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalDelta >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {' '}{totalDelta >= 0 ? '+' : ''}{(totalDelta / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Imbalance</div>
              <div className={`text-sm font-bold ${totalDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {deltaPercent}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full relative">
          <svg ref={svgRef} width="100%" height={height} />
          
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg opacity-0 transition-opacity z-50"
            style={{ opacity: 0 }}
          />
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
          <div className="p-2 bg-green-500/10 rounded">
            <div className="text-slate-400 mb-1">Total Buy</div>
            <div className="text-green-400 font-bold">
              {(totalBuy / 1000).toFixed(0)}K contracts
            </div>
          </div>
          <div className="p-2 bg-red-500/10 rounded">
            <div className="text-slate-400 mb-1">Total Sell</div>
            <div className="text-red-400 font-bold">
              {(totalSell / 1000).toFixed(0)}K contracts
            </div>
          </div>
          <div className={`p-2 ${totalDelta >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} rounded`}>
            <div className="text-slate-400 mb-1">Net Delta</div>
            <div className={`${totalDelta >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
              {totalDelta >= 0 ? '+' : ''}{(totalDelta / 1000).toFixed(0)}K
            </div>
          </div>
        </div>

        {/* Signal interpretation */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-start gap-2">
            {totalDelta >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-400 mt-0.5" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-medium text-white mb-1">
                {totalDelta >= 0 ? 'Bullish Order Flow' : 'Bearish Order Flow'}
              </div>
              <div className="text-xs text-slate-400">
                {totalDelta >= 0
                  ? 'More aggressive buying than selling. Institutions accumulating.'
                  : 'More aggressive selling than buying. Institutions distributing.'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
