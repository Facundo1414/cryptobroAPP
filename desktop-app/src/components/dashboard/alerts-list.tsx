'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMarketDataStore } from '@/stores/market-data-store';
import { alertsApi } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/utils';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  id: string;
  cryptoSymbol: string;
  condition: string;
  targetPrice: number;
  message: string;
  status: string;
  createdAt: string;
}

export function AlertsList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const realtimeAlerts = useMarketDataStore((state) => state.alerts);

  useEffect(() => {
    alertsApi
      .getAll()
      .then((data: any) => {
        setAlerts(data.filter((a: any) => a.status === 'ACTIVE'));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await alertsApi.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-500" />
          Active Alerts
          {realtimeAlerts.length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs">
              {realtimeAlerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-shimmer rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : alerts.length === 0 && realtimeAlerts.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-gray-400">
            No active alerts
          </div>
        ) : (
          <div className="space-y-3">
            {/* Realtime Alerts */}
            {realtimeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="animate-pulse rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-yellow-500">
                      🔔 {alert.cryptoSymbol}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">{alert.message}</p>
                    <p className="mt-1 text-xs text-gray-500">just now</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Active Alerts */}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{alert.cryptoSymbol}</p>
                    <p className="mt-1 text-sm text-gray-300">
                      {alert.condition} ${alert.targetPrice.toLocaleString()}
                    </p>
                    {alert.message && (
                      <p className="mt-1 text-sm text-gray-400">{alert.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formatRelativeTime(alert.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(alert.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
