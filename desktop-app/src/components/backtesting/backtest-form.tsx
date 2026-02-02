'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { backtestingApi, strategiesApi, cryptoApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface BacktestFormProps {
  onBacktestStart: () => void;
  onBacktestComplete: (result: any) => void;
}

export default function BacktestForm({ onBacktestStart, onBacktestComplete }: BacktestFormProps) {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    strategyId: '',
    cryptoSymbol: '',
    startDate: '',
    endDate: '',
    initialCapital: 10000,
    timeframe: '1h',
  });

  useEffect(() => {
    loadStrategies();
    loadCryptos();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await strategiesApi.getAll() as any;
      // Map strategy names to ID-like format for the form
      const strategiesList = response.data || response || [];
      const mapped = strategiesList.map((s: any) => ({
        id: s.name || s.id,
        name: s.name || s.id,
        description: s.description,
      }));
      setStrategies(mapped);
    } catch (error) {
      console.error('Error loading strategies:', error);
      // Fallback to hardcoded strategies
      setStrategies([
        { id: 'RSI_VOLUME', name: 'RSI_VOLUME', description: 'RSI with Volume Confirmation' },
        { id: 'EMA_RIBBON', name: 'EMA_RIBBON', description: 'EMA Ribbon Strategy' },
        { id: 'MACD_RSI', name: 'MACD_RSI', description: 'MACD + RSI Confluence' },
      ]);
    }
  };

  const loadCryptos = async () => {
    try {
      const response = await cryptoApi.getAll() as any;
      setCryptos(response.data || []);
    } catch (error) {
      console.error('Error loading cryptos:', error);
      toast.error('Failed to load cryptocurrencies');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.strategyId || !formData.cryptoSymbol || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    onBacktestStart();

    try {
      const response = await backtestingApi.create({
        strategyId: formData.strategyId,
        cryptoSymbol: formData.cryptoSymbol,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        initialCapital: formData.initialCapital,
        timeframe: formData.timeframe,
      }) as any;

      toast.success('Backtest completed successfully!');
      onBacktestComplete(response.data);
    } catch (error: any) {
      console.error('Error running backtest:', error);
      toast.error(error.response?.data?.message || 'Failed to run backtest');
      onBacktestComplete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Backtest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy *</Label>
              <select
                id="strategy"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.strategyId}
                onChange={(e) => setFormData({ ...formData, strategyId: e.target.value })}
                required
              >
                <option value="">Select a strategy</option>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crypto">Cryptocurrency *</Label>
              <select
                id="crypto"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cryptoSymbol}
                onChange={(e) => setFormData({ ...formData, cryptoSymbol: e.target.value })}
                required
              >
                <option value="">Select a cryptocurrency</option>
                {cryptos.map((crypto) => (
                  <option key={crypto.id} value={crypto.symbol}>
                    {crypto.name} ({crypto.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialCapital">Initial Capital (USD) *</Label>
              <Input
                id="initialCapital"
                type="number"
                min="100"
                step="100"
                value={formData.initialCapital}
                onChange={(e) => setFormData({ ...formData, initialCapital: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe *</Label>
              <select
                id="timeframe"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                required
              >
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="1d">1 day</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Run Backtest
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
