'use client';

import { useState, useEffect } from 'react';
import { watchlistApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Star, Trash2, Loader2 } from 'lucide-react';

interface WatchlistItem {
  id: string;
  cryptoId: string;
  userId: string;
  notes: string | null;
  alertOnBuy: boolean;
  alertOnSell: boolean;
  addedAt: Date;
  crypto: {
    id: string;
    symbol: string;
    name: string;
    imageUrl: string | null;
  };
}

export function WatchlistWidget() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await watchlistApi.getAll() as any;
      setWatchlist(response.data || response || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      toast.error('Error al cargar lista de seguimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await watchlistApi.remove(symbol);
      toast.success(`${symbol} eliminado de la lista de seguimiento`);
      loadWatchlist();
    } catch (error) {
      toast.error('Error al eliminar de la lista de seguimiento');
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Lista de Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (watchlist.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Lista de Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-400 py-8">
            No hay criptomonedas en tu lista de seguimiento aún.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Lista de Seguimiento ({watchlist.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3"
            >
              <div className="flex items-center gap-3">
                {item.crypto.imageUrl && (
                  <img
                    src={item.crypto.imageUrl}
                    alt={item.crypto.name}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-white">{item.crypto.symbol}</p>
                  <p className="text-xs text-gray-400">{item.crypto.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.alertOnBuy && (
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    Compra
                  </Badge>
                )}
                {item.alertOnSell && (
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    Venta
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => removeFromWatchlist(item.crypto.symbol)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
