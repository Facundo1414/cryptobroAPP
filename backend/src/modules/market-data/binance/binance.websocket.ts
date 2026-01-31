import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as WebSocket from "ws";
import { BinanceService } from "./binance.service";
import { BinanceKlineData, ParsedCandle } from "./binance.types";

export interface WebSocketSubscription {
  symbol: string;
  interval: string;
  callback: (candle: ParsedCandle) => void;
}

@Injectable()
export class BinanceWebsocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceWebsocketService.name);
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly binanceService: BinanceService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log("🔌 Initializing Binance WebSocket Service");
    // Don't auto-connect, wait for subscriptions
  }

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * Subscribe to kline/candlestick stream
   */
  subscribe(
    symbol: string,
    interval: string,
    callback: (candle: ParsedCandle) => void,
  ): void {
    const key = `${symbol}_${interval}`;

    this.subscriptions.set(key, { symbol, interval, callback });
    this.logger.log(`📊 Subscribed to ${symbol} ${interval} stream`);

    // Connect if not already connected
    if (!this.isConnected) {
      this.connect();
    } else {
      // If already connected, send subscribe message
      this.sendSubscribeMessage(symbol, interval);
    }
  }

  /**
   * Unsubscribe from a stream
   */
  unsubscribe(symbol: string, interval: string): void {
    const key = `${symbol}_${interval}`;

    if (this.subscriptions.has(key)) {
      this.subscriptions.delete(key);
      this.logger.log(`🔕 Unsubscribed from ${symbol} ${interval} stream`);

      if (this.isConnected) {
        this.sendUnsubscribeMessage(symbol, interval);
      }
    }

    // Disconnect if no more subscriptions
    if (this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Connect to Binance WebSocket
   */
  private connect(): void {
    if (this.isConnected) {
      this.logger.warn("Already connected to WebSocket");
      return;
    }

    const wsUrl = this.binanceService.getWebSocketUrl();
    this.logger.log(`🔌 Connecting to Binance WebSocket: ${wsUrl}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.on("open", () => {
      this.logger.log("✅ WebSocket connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Subscribe to all streams
      this.subscriptions.forEach((sub) => {
        this.sendSubscribeMessage(sub.symbol, sub.interval);
      });

      // Start ping interval to keep connection alive
      this.startPingInterval();
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        this.logger.error("Error parsing WebSocket message", error);
      }
    });

    this.ws.on("error", (error) => {
      this.logger.error("WebSocket error", error);
    });

    this.ws.on("close", () => {
      this.logger.warn("❌ WebSocket disconnected");
      this.isConnected = false;
      this.stopPingInterval();
      this.attemptReconnect();
    });

    this.ws.on("ping", () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.pong();
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  private disconnect(): void {
    if (this.ws) {
      this.logger.log("🔌 Disconnecting from WebSocket");
      this.isConnected = false;
      this.stopPingInterval();
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error("❌ Max reconnection attempts reached");
      return;
    }

    if (this.subscriptions.size === 0) {
      this.logger.log("No active subscriptions, skipping reconnect");
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(
      `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Send subscribe message
   */
  private sendSubscribeMessage(symbol: string, interval: string): void {
    const stream = `${this.binanceService.formatSymbolForStream(symbol)}@kline_${interval}`;

    const subscribeMessage = {
      method: "SUBSCRIBE",
      params: [stream],
      id: Date.now(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscribeMessage));
      this.logger.log(`📡 Subscribed to stream: ${stream}`);
    }
  }

  /**
   * Send unsubscribe message
   */
  private sendUnsubscribeMessage(symbol: string, interval: string): void {
    const stream = `${this.binanceService.formatSymbolForStream(symbol)}@kline_${interval}`;

    const unsubscribeMessage = {
      method: "UNSUBSCRIBE",
      params: [stream],
      id: Date.now(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.logger.log(`📡 Unsubscribed from stream: ${stream}`);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: any): void {
    // Ignore subscription confirmation messages
    if (message.result === null || message.id) {
      return;
    }

    // Handle kline data
    if (message.e === "kline") {
      this.handleKlineMessage(message as BinanceKlineData);
    }
  }

  /**
   * Handle kline/candlestick data
   */
  private handleKlineMessage(data: BinanceKlineData): void {
    const { s: symbol, k } = data;
    const key = `${symbol}_${k.i}`;

    const subscription = this.subscriptions.get(key);
    if (!subscription) {
      return;
    }

    const candle: ParsedCandle = {
      symbol: symbol,
      timestamp: new Date(k.t),
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      timeframe: k.i,
      isClosed: k.x,
    };

    // Call the callback with the parsed candle
    subscription.callback(candle);

    // Log only closed candles to avoid spam
    if (candle.isClosed) {
      this.logger.debug(
        `📊 New candle: ${symbol} ${k.i} - Close: ${candle.close}, Volume: ${candle.volume}`,
      );
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get connection status
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get active subscriptions count
   */
  getSubscriptionsCount(): number {
    return this.subscriptions.size;
  }
}
