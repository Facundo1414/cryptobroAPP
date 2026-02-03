'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VolumeProfileData {
  price: number;
  volume: number;
  isPOC: boolean;
  inValueArea: boolean;
}

interface VolumeProfileProps {
  data: VolumeProfileData[];
  currentPrice: number;
  poc?: number;
  valueAreaHigh?: number;
  valueAreaLow?: number;
  height?: number;
}

export function VolumeProfile({
  data,
  currentPrice,
  poc,
  valueAreaHigh,
  valueAreaLow,
  height = 500,
}: VolumeProfileProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 200;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.price) || 0, d3.max(data, (d) => d.price) || 0])
      .range([innerHeight, 0]);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.volume) || 0])
      .range([0, innerWidth]);

    // Value Area background
    if (valueAreaHigh && valueAreaLow) {
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(valueAreaHigh))
        .attr('width', innerWidth)
        .attr('height', yScale(valueAreaLow) - yScale(valueAreaHigh))
        .attr('fill', '#64748b')
        .attr('opacity', 0.1);
    }

    // Volume bars
    const barHeight = innerHeight / data.length;

    g.selectAll('.volume-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'volume-bar')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.price) - barHeight / 2)
      .attr('width', (d) => xScale(d.volume))
      .attr('height', barHeight)
      .attr('fill', (d) => {
        if (d.isPOC) return '#facc15'; // POC - Yellow
        if (d.inValueArea) return '#10b981'; // Value Area - Green
        return '#64748b'; // Normal - Gray
      })
      .attr('opacity', 0.7);

    // POC line
    if (poc) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(poc))
        .attr('y2', yScale(poc))
        .attr('stroke', '#facc15')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      // POC label
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', yScale(poc) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#facc15')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(`POC: $${poc.toLocaleString()}`);
    }

    // Current price line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(currentPrice))
      .attr('y2', yScale(currentPrice))
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2);

    // Current price label
    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yScale(currentPrice) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#a855f7')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(`$${currentPrice.toLocaleString()}`);

    // Price axis
    const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat((d) => `$${d3.format('.0f')(d as number)}`);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px');

  }, [data, currentPrice, poc, valueAreaHigh, valueAreaLow, height]);

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white">Volume Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} width="100%" height={height} />
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span className="text-slate-400">Point of Control (POC)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-slate-400">Value Area (70% volume)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-500 rounded" />
            <span className="text-slate-400">Low Volume Nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-purple-500" />
            <span className="text-slate-400">Current Price</span>
          </div>
        </div>

        {poc && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">POC</div>
            <div className="text-lg font-bold text-yellow-400">
              ${poc.toLocaleString()}
            </div>
          </div>
        )}

        {valueAreaHigh && valueAreaLow && (
          <div className="mt-2 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Value Area</div>
            <div className="text-sm text-green-400">
              ${valueAreaLow.toLocaleString()} - ${valueAreaHigh.toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
