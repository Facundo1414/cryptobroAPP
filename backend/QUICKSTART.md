# Backend - Getting Started 🚀

## Prerequisites

- Node.js 18+ and pnpm
- Docker Desktop
- PostgreSQL (via Docker)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/crypto_analyzer"

# Binance API (get from https://www.binance.com/en/my/settings/api-management)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
BINANCE_REST_URL=https://api.binance.com
BINANCE_WS_URL=wss://stream.binance.com:9443/ws

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development
```

### 3. Start Infrastructure

Start PostgreSQL and Redis using Docker:

```bash
# From the root directory
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

You should see:

- `cryptobro-postgres` (PostgreSQL + TimescaleDB)
- `cryptobro-redis` (Redis cache)

### 4. Setup Database

Generate Prisma client:

```bash
pnpm prisma:generate
```

Run migrations to create tables:

```bash
pnpm prisma:migrate
```

Seed initial data (cryptocurrencies):

```bash
pnpm prisma:seed
```

### 5. Start Backend Server

```bash
pnpm start:dev
```

The server will start on `http://localhost:3000`

## Test the API

### API Documentation

Open Swagger UI to explore all endpoints:

```
http://localhost:3000/api/docs
```

### Test Binance Connection

```bash
curl http://localhost:3000/api/v1/market-data/test-connection
```

Expected response:

```json
{
  "connected": true,
  "message": "Connected to Binance API"
}
```

### Get All Cryptocurrencies

```bash
curl http://localhost:3000/api/v1/crypto
```

### Get Current Bitcoin Price

```bash
curl http://localhost:3000/api/v1/market-data/price/BTCUSDT
```

### Start Monitoring Bitcoin

```bash
curl -X POST "http://localhost:3000/api/v1/market-data/monitor/start/BTCUSDT?timeframe=1h"
```

This will:

1. Subscribe to Binance WebSocket for real-time BTC price updates
2. Fetch last 100 historical candles
3. Save all data to PostgreSQL database

### Check Logs

Watch the server logs to see real-time data:

```bash
# You should see logs like:
# 📊 New candle: BTCUSDT 1h - Close: 43523.50, Volume: 1234.56
# 💾 Saved candle: BTCUSDT 1h @ 43523.50
```

## Database Management

### View Database with Prisma Studio

```bash
pnpm prisma:studio
```

Open `http://localhost:5555` to visually explore your data.

### View Database with Redis Commander

Redis Commander is already running via Docker:

```
http://localhost:8081
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed script
├── src/
│   ├── common/
│   │   └── prisma/        # Prisma module
│   ├── modules/
│   │   ├── crypto/        # ✅ Cryptocurrency CRUD
│   │   └── market-data/   # ✅ Binance integration
│   │       └── binance/
│   │           ├── binance.service.ts      # REST API
│   │           ├── binance.websocket.ts    # WebSocket
│   │           └── binance.types.ts        # Types
│   ├── app.module.ts      # Main module
│   └── main.ts           # Entry point
└── package.json
```

## Next Steps

Now that the backend is running:

1. ✅ Binance connection works
2. ✅ Real-time price data is being collected
3. ✅ Data is saved to TimescaleDB

**Next Sprint Tasks:**

- [ ] Implement Indicators Service (RSI, MACD, EMA)
- [ ] Implement Trading Strategies
- [ ] Build Signal Generation
- [ ] Add Backtesting Engine

## Troubleshooting

### Docker not starting

```bash
docker-compose down
docker-compose up -d
```

### Database connection error

Make sure PostgreSQL is running:

```bash
docker logs cryptobro-postgres
```

### Binance API errors

- Check your API keys in `.env`
- Verify your IP is whitelisted on Binance
- For testing, you can use Binance Testnet:
  - REST: `https://testnet.binance.vision`
  - WebSocket: `wss://testnet.binance.vision/ws`

### Port already in use

Change the `PORT` in your `.env` file:

```env
PORT=3001
```

## Useful Commands

```bash
# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Reset database
pnpm prisma:migrate reset

# Generate new migration
pnpm prisma:migrate dev --name description

# Format code
pnpm format

# Lint code
pnpm lint
```

## API Endpoints

### Market Data

- `GET /api/v1/market-data/test-connection` - Test Binance connection
- `GET /api/v1/market-data/price/:symbol` - Get current price
- `GET /api/v1/market-data/candles/:symbol` - Get historical candles
- `POST /api/v1/market-data/monitor/start/:symbol` - Start monitoring
- `POST /api/v1/market-data/monitor/stop/:symbol` - Stop monitoring

### Crypto

- `GET /api/v1/crypto` - List all cryptocurrencies
- `GET /api/v1/crypto/:id` - Get cryptocurrency by ID
- `GET /api/v1/crypto/symbol/:symbol` - Get cryptocurrency by symbol
- `POST /api/v1/crypto` - Create new cryptocurrency
- `POST /api/v1/crypto/seed` - Seed initial data

Full API documentation: http://localhost:3000/api/docs
