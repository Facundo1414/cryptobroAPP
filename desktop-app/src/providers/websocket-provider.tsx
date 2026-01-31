'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketDataStore } from '@/stores/market-data-store';
import { toast } from 'sonner';
import { NotificationService } from '@/lib/notification-service';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000/realtime';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { accessToken, user } = useAuthStore();
  const { updatePrice, addSignal, addAlert } = useMarketDataStore();
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    // For development, we'll connect without authentication
    // TODO: Uncomment when auth is ready
    // if (!user || !accessToken) {
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //     socketRef.current = null;
    //   }
    //   return;
    // }

    // Connect to WebSocket
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
      
      // Authenticate (skip for now in development)
      if (accessToken) {
        socket.emit('authenticate', { token: accessToken });
      } else {
        // Auto-subscribe without auth for development
        setIsAuthenticated(true);
        subscribeToChannels(socket);
      }
    });

    socket.on('authenticated', (message) => {
      console.log('✅ WebSocket authenticated:', message.data);
      setIsAuthenticated(true);
      toast.success('Connected to real-time updates', {
        duration: 2000,
      });
      
      subscribeToChannels(socket);
    });

    socket.on('subscribed', (message) => {
      console.log('📡 Subscribed to channel:', message.data.channel);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        socket.connect();
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      reconnectAttemptRef.current = attemptNumber;
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      toast.success('Reconnected to real-time updates');
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      toast.error('Failed to reconnect to real-time updates');
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      toast.error('WebSocket connection error');
    });

    // Data handlers
    socket.on('price:update', (message) => {
      if (message?.data) {
        updatePrice(message.data);
      }
    });

    socket.on('candle:update', (message) => {
      // Handle candle updates if needed
      console.debug('Candle update:', message.data);
    });

    socket.on('signal:created', (message) => {
      const signal = message.data;
      addSignal(signal);
      
      // Show notification
      const action = signal.type === 'BUY' ? '🟢 BUY' : '🔴 SELL';
      const confidencePercent = (signal.confidence * 100).toFixed(0);
      
      toast.success(`${action} Signal: ${signal.cryptoSymbol}`, {
        description: `${signal.reason} (${confidencePercent}% confidence)`,
        duration: 5000,
      });
      
      // Send desktop notification if supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        NotificationService.sendSignal({
          type: signal.type,
          symbol: signal.cryptoSymbol,
          confidence: signal.confidence,
          reason: signal.reason,
        });
      }
    });

    socket.on('alert:triggered', (message) => {
      const alert = message.data;
      addAlert(alert);
      
      // Show notification
      toast.warning(`⚠️ Alert: ${alert.cryptoSymbol}`, {
        description: alert.message,
        duration: 5000,
      });
      
      // Send desktop notification if supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        NotificationService.sendAlert({
          symbol: alert.cryptoSymbol,
          message: alert.message,
        });
      }
    });

    // Cleanup
    return () => {
      if (socket) {
        console.log('Cleaning up WebSocket connection');
        socket.disconnect();
      }
    };
  }, [accessToken]); // Only reconnect when accessToken changes

  // Helper function to subscribe to channels
  const subscribeToChannels = (socket: Socket) => {
    socket.emit('subscribe', { channel: 'prices' });
    socket.emit('subscribe', { channel: 'signals' });
    socket.emit('subscribe', { channel: 'alerts' });
    socket.emit('subscribe', { channel: 'candles' });
  };

  return <>{children}</>;
}
