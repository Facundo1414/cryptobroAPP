import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { BinanceWebsocketService } from "../market-data/binance/binance.websocket";
import { WebsocketGateway } from "../websocket/websocket.gateway";
import {
  PriceUpdatePayload,
  CandleUpdatePayload,
} from "../websocket/websocket.types";
import { ParsedCandle } from "../market-data/binance/binance.types";

/**
 * Realtime Price Service
 *
 * Connects Binance WebSocket data to our WebSocket Gateway
 * Broadcasts price updates to connected clients in real-time
 */
@Injectable()
export class RealtimePriceService implements OnModuleInit {
  private readonly logger = new Logger(RealtimePriceService.name);

  // Cryptocurrencies to monitor
  private readonly MONITORED_SYMBOLS = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "MATICUSDT",
    "DOTUSDT",
    "LTCUSDT",
  ];

  // Store latest prices for calculating changes
  private priceCache: Map<string, { price: number; timestamp: number }> =
    new Map();

  constructor(
    private readonly binanceWebsocket: BinanceWebsocketService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async onModuleInit() {
    this.logger.log("🚀 Starting Realtime Price Service...");

    // Subscribe to 1-minute candles for all monitored symbols
    for (const symbol of this.MONITORED_SYMBOLS) {
      this.subscribeToSymbol(symbol);
    }

    this.logger.log(
      `✅ Subscribed to ${this.MONITORED_SYMBOLS.length} cryptocurrency price feeds`,
    );
  }

  /**
   * Subscribe to price updates for a symbol
   */
  private subscribeToSymbol(symbol: string): void {
    // Subscribe to 1-minute candles for real-time price updates
    this.binanceWebsocket.subscribe(symbol, "1m", (candle: ParsedCandle) => {
      this.handleCandleUpdate(candle);
    });

    this.logger.debug(`Subscribed to ${symbol} price feed`);
  }

  /**
   * Handle candle update from Binance
   */
  private handleCandleUpdate(candle: ParsedCandle): void {
    const { symbol, close, volume, timestamp, isClosed } = candle;

    // Calculate 24h change (simplified - using cached previous price)
    const cached = this.priceCache.get(symbol);
    let change24h = 0;

    if (cached) {
      change24h = ((close - cached.price) / cached.price) * 100;
    }

    // Update cache
    this.priceCache.set(symbol, {
      price: close,
      timestamp: timestamp.getTime(),
    });

    // Create price update payload
    const priceUpdate: PriceUpdatePayload = {
      symbol: symbol.replace("USDT", ""), // Remove USDT suffix
      price: close,
      change24h,
      volume24h: volume, // This is approximate, real 24h volume would need more data
      timestamp: timestamp.getTime(),
    };

    // Broadcast to WebSocket clients
    this.websocketGateway.broadcastPriceUpdate(priceUpdate);

    // Also broadcast candle data
    if (isClosed) {
      const candleUpdate: CandleUpdatePayload = {
        symbol: symbol.replace("USDT", ""),
        interval: candle.timeframe,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        timestamp: timestamp.getTime(),
      };

      this.websocketGateway.broadcastCandleUpdate(candleUpdate);
    }
  }

  /**
   * Add a new symbol to monitor
   */
  addSymbol(symbol: string): void {
    if (!this.MONITORED_SYMBOLS.includes(symbol)) {
      this.MONITORED_SYMBOLS.push(symbol);
      this.subscribeToSymbol(symbol);
      this.logger.log(`Added ${symbol} to monitored symbols`);
    }
  }

  /**
   * Get currently monitored symbols
   */
  getMonitoredSymbols(): string[] {
    return [...this.MONITORED_SYMBOLS];
  }

  /**
   * Get latest price for a symbol
   */
  getLatestPrice(symbol: string): number | null {
    const cached = this.priceCache.get(symbol);
    return cached ? cached.price : null;
  }
}
