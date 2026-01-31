# 🚀 Backend API - Guía Completa de Endpoints

## 📋 Tabla de Contenidos

- [Market Data](#market-data) - Datos de mercado en tiempo real
- [Crypto](#crypto) - Gestión de criptomonedas
- [Indicators](#indicators) - Indicadores técnicos
- [Strategies](#strategies) - Estrategias de trading
- [Signals](#signals) - Señales de trading
- [Alerts](#alerts) - Alertas y notificaciones

---

## Market Data

### Test Connection

```bash
GET /api/v1/market-data/test-connection
```

### Get Current Price

```bash
GET /api/v1/market-data/price/{symbol}
# Example: GET /api/v1/market-data/price/BTCUSDT
```

### Get Historical Candles

```bash
GET /api/v1/market-data/candles/{symbol}?timeframe=1h&limit=100
# Example: GET /api/v1/market-data/candles/BTCUSDT?timeframe=4h&limit=50
```

### Start Monitoring

```bash
POST /api/v1/market-data/monitor/start/{symbol}?timeframe=1h
# Example: POST /api/v1/market-data/monitor/start/ETHUSDT?timeframe=1h
```

### Stop Monitoring

```bash
POST /api/v1/market-data/monitor/stop/{symbol}?timeframe=1h
```

---

## Crypto

### List All Cryptocurrencies

```bash
GET /api/v1/crypto
# Optional: ?includeInactive=true
```

### Get Crypto by ID

```bash
GET /api/v1/crypto/{id}
```

### Get Crypto by Symbol

```bash
GET /api/v1/crypto/symbol/{symbol}
# Example: GET /api/v1/crypto/symbol/BTC
```

### Create Cryptocurrency

```bash
POST /api/v1/crypto
Content-Type: application/json

{
  "name": "Bitcoin",
  "symbol": "BTC",
  "binanceSymbol": "BTCUSDT",
  "description": "First cryptocurrency",
  "logoUrl": "https://...",
  "isActive": true
}
```

### Seed Initial Cryptos

```bash
POST /api/v1/crypto/seed
```

---

## Indicators

### Calculate RSI

```bash
GET /api/v1/indicators/rsi/{symbol}?timeframe=1h&period=14
# Example: GET /api/v1/indicators/rsi/BTCUSDT?timeframe=1h&period=14

Response:
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "timestamp": "2026-01-14T...",
  "value": 28.5,
  "period": 14,
  "signal": "OVERSOLD"
}
```

### Calculate MACD

```bash
GET /api/v1/indicators/macd/{symbol}?timeframe=1h

Response:
{
  "symbol": "BTCUSDT",
  "macd": 45.2,
  "signal": 38.1,
  "histogram": 7.1,
  "trend": "BULLISH"
}
```

### Calculate EMA

```bash
GET /api/v1/indicators/ema/{symbol}?timeframe=1h&period=20
```

### Calculate EMA Ribbon

```bash
GET /api/v1/indicators/ema-ribbon/{symbol}?timeframe=1h

Response:
{
  "symbol": "BTCUSDT",
  "ema5": 43520,
  "ema10": 43480,
  "ema20": 43400,
  "ema50": 43200,
  "ema200": 42800,
  "alignment": "BULLISH"
}
```

### Calculate Bollinger Bands

```bash
GET /api/v1/indicators/bollinger/{symbol}?timeframe=1h

Response:
{
  "upper": 44000,
  "middle": 43500,
  "lower": 43000,
  "currentPrice": 43523.50,
  "position": "BETWEEN"
}
```

### Analyze Volume

```bash
GET /api/v1/indicators/volume/{symbol}?timeframe=1h

Response:
{
  "currentVolume": 1500,
  "avgVolume": 1000,
  "volumeRatio": 1.5,
  "isSignificant": true
}
```

### Comprehensive Analysis

```bash
GET /api/v1/indicators/analysis/{symbol}?timeframe=1h

Response:
{
  "symbol": "BTCUSDT",
  "price": 43523.50,
  "rsi": { ... },
  "macd": { ... },
  "emaRibbon": { ... },
  "bollinger": { ... },
  "volume": { ... },
  "overallSignal": "STRONG_BUY",
  "confidence": 0.85
}
```

---

## Strategies

### List Available Strategies

```bash
GET /api/v1/strategies

Response:
[
  {
    "name": "RSI_VOLUME",
    "description": "RSI with Volume Confirmation",
    "winRate": "68-72%"
  },
  {
    "name": "EMA_RIBBON",
    "description": "EMA Ribbon Strategy",
    "winRate": "65-70%"
  },
  {
    "name": "MACD_RSI",
    "description": "MACD + RSI Confluence",
    "winRate": "63-68%"
  }
]
```

### Analyze with Specific Strategy

```bash
GET /api/v1/strategies/analyze/{strategy}/{symbol}?timeframe=1h

Examples:
GET /api/v1/strategies/analyze/RSI_VOLUME/BTCUSDT?timeframe=1h
GET /api/v1/strategies/analyze/EMA_RIBBON/ETHUSDT?timeframe=4h
GET /api/v1/strategies/analyze/MACD_RSI/SOLUSDT?timeframe=1h

Response:
{
  "shouldEnter": true,
  "shouldExit": false,
  "signal": {
    "type": "BUY",
    "price": 43523.50,
    "confidence": 0.85,
    "stopLoss": 42652.23,
    "takeProfit": 44611.59,
    "reasoning": "RSI oversold (28.50), volume spike (2.3x), price above EMA20"
  },
  "analysis": "..."
}
```

### Analyze with All Strategies

```bash
GET /api/v1/strategies/analyze-all/{symbol}?timeframe=1h

Response:
{
  "RSI_VOLUME": { ... },
  "EMA_RIBBON": { ... },
  "MACD_RSI": { ... }
}
```

### Get Consensus Signal

```bash
GET /api/v1/strategies/consensus/{symbol}?timeframe=1h

Response:
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "consensus": "STRONG_BUY",
  "confidence": 0.82,
  "agreementRate": 1.0,
  "strategies": {
    "RSI_VOLUME": { "signal": { ... } },
    "EMA_RIBBON": { "signal": { ... } },
    "MACD_RSI": { "signal": { ... } }
  }
}
```

---

## Signals

### List All Signals

```bash
GET /api/v1/signals
# Optional filters:
# ?cryptoId=xxx
# ?strategyId=xxx
# ?type=BUY
# ?limit=50
```

### Get Signal by ID

```bash
GET /api/v1/signals/{id}
```

### Get Recent Signals for Crypto

```bash
GET /api/v1/signals/crypto/{symbol}?limit=10
# Example: GET /api/v1/signals/crypto/BTCUSDT?limit=20

Response:
[
  {
    "id": "signal-id",
    "type": "BUY",
    "price": 43523.50,
    "confidence": 0.85,
    "stopLoss": 42652.23,
    "takeProfit": 44611.59,
    "timeframe": "1h",
    "reasoning": "...",
    "crypto": { ... },
    "strategy": { ... },
    "createdAt": "2026-01-14T..."
  }
]
```

### Generate Signals for Crypto

```bash
POST /api/v1/signals/generate/{symbol}?timeframe=1h
# Example: POST /api/v1/signals/generate/BTCUSDT?timeframe=4h

Response:
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "consensus": "STRONG_BUY",
  "agreementRate": 1.0,
  "confidence": 0.82,
  "signals": [
    {
      "id": "signal-1",
      "type": "BUY",
      "strategy": { "name": "RSI_VOLUME" },
      ...
    },
    ...
  ]
}
```

### Get Signal Statistics

```bash
GET /api/v1/signals/statistics
# Optional: ?cryptoId=xxx

Response:
{
  "total": 150,
  "buySignals": 80,
  "sellSignals": 70,
  "averageConfidence": 0.75
}
```

---

## Alerts

### Create Alert

```bash
POST /api/v1/alerts
Content-Type: application/json

{
  "userId": "user-id",
  "cryptoId": "crypto-id",
  "condition": "ABOVE",
  "targetPrice": 45000,
  "message": "BTC reached $45,000",
  "notifyEmail": true,
  "notifyPush": true
}
```

### Get User Alerts

```bash
GET /api/v1/alerts/user/{userId}
# Optional: ?status=ACTIVE

Response:
[
  {
    "id": "alert-id",
    "condition": "ABOVE",
    "targetPrice": 45000,
    "status": "ACTIVE",
    "crypto": { ... },
    "createdAt": "..."
  }
]
```

### Get Alert by ID

```bash
GET /api/v1/alerts/{id}
```

### Update Alert

```bash
PATCH /api/v1/alerts/{id}
Content-Type: application/json

{
  "status": "CANCELLED",
  "targetPrice": 46000
}
```

### Delete Alert

```bash
DELETE /api/v1/alerts/{id}
```

### Create Alert from Signal

```bash
POST /api/v1/alerts/from-signal/{userId}/{signalId}

# Automatically creates an alert based on a trading signal
```

### Get Alert Statistics

```bash
GET /api/v1/alerts/statistics/{userId}

Response:
{
  "total": 25,
  "active": 10,
  "triggered": 12,
  "cancelled": 3
}
```

---

## 🔄 Complete Workflow Example

```bash
# 1. Start monitoring BTC
curl -X POST "http://localhost:3000/api/v1/market-data/monitor/start/BTCUSDT?timeframe=1h"

# 2. Wait 1 minute for data collection...

# 3. Get comprehensive analysis
curl "http://localhost:3000/api/v1/indicators/analysis/BTCUSDT?timeframe=1h"

# 4. Get consensus from all strategies
curl "http://localhost:3000/api/v1/strategies/consensus/BTCUSDT?timeframe=1h"

# 5. Generate and save signals
curl -X POST "http://localhost:3000/api/v1/signals/generate/BTCUSDT?timeframe=1h"

# 6. Get recent signals
curl "http://localhost:3000/api/v1/signals/crypto/BTCUSDT?limit=5"

# 7. Create alert from signal
curl -X POST "http://localhost:3000/api/v1/alerts/from-signal/{userId}/{signalId}"
```

---

## 🤖 Automatic Features

### Scheduled Tasks

The backend automatically:

1. **Every Hour**: Generates signals for all active cryptocurrencies
   - Analyzes all 3 strategies
   - Saves signals to database
   - Can be viewed via `/api/v1/signals`

2. **Every Minute**: Checks active alerts
   - Monitors price changes
   - Triggers notifications when conditions are met
   - Updates alert status

---

## 📊 Response Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 Authentication

Currently, the API is open. Authentication will be added in Sprint 2.

For now, use a test user ID for alerts: `test-user-id`

---

## 📖 Swagger Documentation

Full interactive API documentation available at:

```
http://localhost:3000/api/docs
```
