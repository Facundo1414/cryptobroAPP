'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { alertsApi } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, TrendingUp, TrendingDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Alert {
  id: string;
  cryptoSymbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  message?: string;
  createdAt: string;
}

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertsApi.getAll() as any;
      const alertsData = response.data || response || [];
      setAlerts(alertsData.slice(0, 3)); // Top 3 alerts
    } catch (error) {
      console.error('Failed to load alerts:', error);
      // Mock data
      setAlerts([
        {
          id: '1',
          cryptoSymbol: 'BTC',
          condition: 'ABOVE',
          targetPrice: 46000,
          message: 'Bitcoin reaching target',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          cryptoSymbol: 'ETH',
          condition: 'BELOW',
          targetPrice: 2300,
          message: 'Ethereum dip alert',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await alertsApi.delete(id);
      setAlerts(alerts.filter((a) => a.id !== id));
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Active Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            No active alerts
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 relative group"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteAlert(alert.id)}
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {alert.cryptoSymbol}
                  </span>
                  <Badge variant={alert.condition === 'ABOVE' ? 'success' : 'danger'}>
                    {alert.condition === 'ABOVE' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {alert.condition}
                  </Badge>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-300">
                  ${alert.targetPrice.toLocaleString()}
                </span>
              </div>
              {alert.message && (
                <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
