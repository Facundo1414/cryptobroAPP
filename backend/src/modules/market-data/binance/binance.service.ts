import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";
import {
  BinanceCredentials,
  BinanceCandle,
  BinanceTicker24hr,
  BinanceExchangeInfo,
  BinanceTimeframe,
  ParsedCandle,
} from "./binance.types";

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private readonly credentials: BinanceCredentials;
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.credentials = {
      apiKey: this.configService.get<string>("BINANCE_API_KEY") || "",
      apiSecret: this.configService.get<string>("BINANCE_API_SECRET") || "",
      baseUrl:
        this.configService.get<string>(
          "BINANCE_REST_URL",
          "https://api.binance.com",
        ) || "https://api.binance.com",
      wsUrl:
        this.configService.get<string>(
          "BINANCE_WS_URL",
          "wss://stream.binance.com:9443/ws",
        ) || "wss://stream.binance.com:9443/ws",
    };

    this.httpClient = axios.create({
      baseURL: this.credentials.baseUrl,
      headers: {
        "X-MBX-APIKEY": this.credentials.apiKey,
      },
    });

    this.logger.log("✅ Binance Service initialized");
  }

  /**
   * Test connectivity to Binance API
   */
  async ping(): Promise<boolean> {
    try {
      await this.httpClient.get("/api/v3/ping");
      this.logger.log("✅ Binance API is reachable");
      return true;
    } catch (error) {
      this.logger.error("❌ Failed to ping Binance API", error);
      return false;
    }
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<number> {
    try {
      const response = await this.httpClient.get("/api/v3/time");
      return response.data.serverTime;
    } catch (error) {
      this.logger.error("Error getting server time", error);
      throw error;
    }
  }

  /**
   * Get exchange information
   */
  async getExchangeInfo(): Promise<BinanceExchangeInfo> {
    try {
      const response = await this.httpClient.get("/api/v3/exchangeInfo");
      return response.data;
    } catch (error) {
      this.logger.error("Error getting exchange info", error);
      throw error;
    }
  }

  /**
   * Get historical klines/candlesticks
   */
  async getKlines(
    symbol: string,
    interval: BinanceTimeframe,
    limit: number = 100,
    startTime?: number,
    endTime?: number,
  ): Promise<ParsedCandle[]> {
    try {
      const params: any = {
        symbol: symbol.toUpperCase(),
        interval,
        limit,
      };

      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await this.httpClient.get<BinanceCandle[]>(
        "/api/v3/klines",
        { params },
      );

      return response.data.map((candle) =>
        this.parseCandle(candle, symbol, interval),
      );
    } catch (error) {
      this.logger.error(`Error getting klines for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get 24hr ticker price change statistics
   */
  async get24hrTicker(
    symbol?: string,
  ): Promise<BinanceTicker24hr | BinanceTicker24hr[]> {
    try {
      const params = symbol ? { symbol: symbol.toUpperCase() } : {};
      const response = await this.httpClient.get("/api/v3/ticker/24hr", {
        params,
      });
      return response.data;
    } catch (error) {
      this.logger.error("Error getting 24hr ticker", error);
      throw error;
    }
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await this.httpClient.get("/api/v3/ticker/price", {
        params: { symbol: symbol.toUpperCase() },
      });
      return parseFloat(response.data.price);
    } catch (error) {
      this.logger.error(`Error getting current price for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get multiple symbol prices
   */
  async getCurrentPrices(symbols: string[]): Promise<Map<string, number>> {
    try {
      const response = await this.httpClient.get("/api/v3/ticker/price");
      const prices = new Map<string, number>();

      const upperSymbols = symbols.map((s) => s.toUpperCase());

      response.data
        .filter((ticker: any) => upperSymbols.includes(ticker.symbol))
        .forEach((ticker: any) => {
          prices.set(ticker.symbol, parseFloat(ticker.price));
        });

      return prices;
    } catch (error) {
      this.logger.error("Error getting multiple prices", error);
      throw error;
    }
  }

  /**
   * Parse Binance candle data to our internal format
   */
  private parseCandle(
    candle: BinanceCandle,
    symbol: string,
    timeframe: string,
  ): ParsedCandle {
    return {
      symbol: symbol.toUpperCase(),
      timestamp: new Date(candle.openTime),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
      timeframe,
      isClosed: true, // Historical candles are always closed
    };
  }

  /**
   * Create signature for authenticated requests
   */
  private createSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.credentials.apiSecret)
      .update(queryString)
      .digest("hex");
  }

  /**
   * Get WebSocket URL for streams
   */
  getWebSocketUrl(): string {
    return this.credentials.wsUrl;
  }

  /**
   * Format symbol for WebSocket stream
   */
  formatSymbolForStream(symbol: string): string {
    return symbol.toLowerCase();
  }
}
