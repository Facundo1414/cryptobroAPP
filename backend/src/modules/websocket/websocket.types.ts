/**
 * WebSocket Types and Interfaces
 * Defines all WebSocket event types and payloads
 */

export enum WebSocketEvent {
  // Connection events
  CONNECT = "connection:ready",
  DISCONNECT = "connection:closed",
  ERROR = "connection:error",

  // Authentication
  AUTHENTICATE = "authenticate",
  AUTHENTICATED = "authenticated",

  // Market Data events
  PRICE_UPDATE = "price:update",
  CANDLE_UPDATE = "candle:update",
  TICKER_UPDATE = "ticker:update",

  // Signal events
  SIGNAL_CREATED = "signal:created",
  SIGNAL_UPDATED = "signal:updated",

  // Alert events
  ALERT_TRIGGERED = "alert:triggered",
  ALERT_CREATED = "alert:created",
  ALERT_DELETED = "alert:deleted",

  // Subscription events
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
  SUBSCRIBED = "subscribed",
  UNSUBSCRIBED = "unsubscribed",
}

export enum SubscriptionChannel {
  PRICES = "prices",
  CANDLES = "candles",
  SIGNALS = "signals",
  ALERTS = "alerts",
  TICKER = "ticker",
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEvent;
  channel?: SubscriptionChannel;
  data: T;
  timestamp: number;
}

export interface PriceUpdatePayload {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

export interface CandleUpdatePayload {
  symbol: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface SignalPayload {
  id: string;
  cryptoSymbol: string;
  type: "BUY" | "SELL" | "HOLD";
  strategy: string;
  price: number;
  confidence: number;
  reason: string;
  timestamp: number;
}

export interface AlertPayload {
  id: string;
  cryptoSymbol: string;
  message: string;
  type: "PRICE" | "SIGNAL";
  timestamp: number;
}

export interface SubscribePayload {
  channel: SubscriptionChannel;
  symbols?: string[]; // Optional: specific symbols to subscribe to
}

export interface AuthenticatePayload {
  token: string;
}

export interface ClientMetadata {
  userId?: string;
  subscriptions: Set<string>;
  authenticated: boolean;
  connectedAt: Date;
}
