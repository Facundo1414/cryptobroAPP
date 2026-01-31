'use client';

import { useState, useEffect } from 'react';
import { watchlistApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';

interface WatchlistButtonProps {
  cryptoSymbol: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function WatchlistButton({
  cryptoSymbol,
  variant = 'ghost',
  size = 'default',
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkWatchlist();
  }, [cryptoSymbol]);

  const checkWatchlist = async () => {
    try {
      const response = await watchlistApi.check(cryptoSymbol) as any;
      setIsInWatchlist(response.data?.isInWatchlist || response.isInWatchlist || false);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleWatchlist = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await watchlistApi.remove(cryptoSymbol);
        toast.success(`${cryptoSymbol} removed from watchlist`);
        setIsInWatchlist(false);
      } else {
        await watchlistApi.add(cryptoSymbol);
        toast.success(`${cryptoSymbol} added to watchlist`);
        setIsInWatchlist(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleWatchlist}
      disabled={isLoading}
      className={isInWatchlist ? 'text-yellow-500' : ''}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-yellow-500' : ''}`} />
      )}
      {size !== 'sm' && (
        <span className="ml-2">{isInWatchlist ? 'Remove' : 'Add to Watchlist'}</span>
      )}
    </Button>
  );
}
