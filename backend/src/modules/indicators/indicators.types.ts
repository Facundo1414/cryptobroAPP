// Technical Indicators Types

export interface IndicatorInput {
  symbol: string;
  timeframe: string;
  period: number;
}

export interface RSIResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  value: number;
  period: number;
  signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
}

export interface MACDResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  macd: number;
  signal: number;
  histogram: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface EMAResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  value: number;
  period: number;
}

export interface EMARibbonResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  ema5: number;
  ema10: number;
  ema20: number;
  ema50: number;
  ema200: number;
  alignment: "BULLISH" | "BEARISH" | "MIXED";
}

export interface BollingerBandsResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  upper: number;
  middle: number;
  lower: number;
  currentPrice: number;
  position: "ABOVE_UPPER" | "BETWEEN" | "BELOW_LOWER";
}

export interface VolumeAnalysis {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  currentVolume: number;
  avgVolume: number;
  volumeRatio: number;
  isSignificant: boolean;
}

export interface ComprehensiveAnalysis {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  price: number;
  rsi: RSIResult;
  macd: MACDResult;
  emaRibbon: EMARibbonResult;
  bollinger: BollingerBandsResult;
  volume: VolumeAnalysis;
  overallSignal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  confidence: number;
}

// ============================================
// NUEVOS INDICADORES - Sprint 6
// ============================================

export interface ATRResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  value: number;
  period: number;
  volatility: "LOW" | "MEDIUM" | "HIGH";
}

export interface VWAPResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  vwap: number;
  currentPrice: number;
  deviation: number; // % above/below VWAP
  signal: "ABOVE_VWAP" | "BELOW_VWAP" | "AT_VWAP";
}

export interface StochRSIResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  stochRSI: number;
  k: number; // Fast %K
  d: number; // Slow %D
  signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
}

export interface OBVResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  obv: number;
  obvEMA: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface SupertrendResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  supertrend: number;
  direction: "UP" | "DOWN";
  currentPrice: number;
  signal: "BUY" | "SELL" | "HOLD";
}

export interface PivotPointsResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  currentPrice: number;
  nearestLevel: string;
}

export interface FibonacciResult {
  symbol: string;
  timeframe: string;
  high: number;
  low: number;
  levels: {
    level0: number; // 0%
    level236: number; // 23.6%
    level382: number; // 38.2%
    level500: number; // 50%
    level618: number; // 61.8%
    level786: number; // 78.6%
    level1000: number; // 100%
  };
  currentPrice: number;
  nearestLevel: string;
}

export interface IchimokuResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  tenkanSen: number; // Conversion Line (9 periods)
  kijunSen: number; // Base Line (26 periods)
  senkouSpanA: number; // Leading Span A
  senkouSpanB: number; // Leading Span B
  chikouSpan: number; // Lagging Span
  cloudTop: number;
  cloudBottom: number;
  currentPrice: number;
  signal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  cloudColor: "GREEN" | "RED";
  priceLocation: "ABOVE_CLOUD" | "IN_CLOUD" | "BELOW_CLOUD";
}

export interface ADXResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  adx: number;
  plusDI: number;
  minusDI: number;
  trend: "STRONG_TREND" | "WEAK_TREND" | "NO_TREND";
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface CCIResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  value: number;
  signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
}

export interface WilliamsRResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  value: number;
  signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
}

export interface MFIResult {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  value: number;
  signal: "OVERSOLD" | "OVERBOUGHT" | "NEUTRAL";
}

// ============================================
// EXTENDED ANALYSIS
// ============================================

export interface ExtendedAnalysis extends ComprehensiveAnalysis {
  atr?: ATRResult;
  vwap?: VWAPResult;
  stochRSI?: StochRSIResult;
  obv?: OBVResult;
  supertrend?: SupertrendResult;
  pivotPoints?: PivotPointsResult;
  ichimoku?: IchimokuResult;
  adx?: ADXResult;
}
