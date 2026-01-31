# Crypto Analyzer Backend

Backend API for Crypto Analyzer - Advanced Trading Analysis Platform

## Tech Stack

- **Framework:** NestJS 10
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **WebSockets:** Socket.io
- **Queue:** Bull (Redis)
- **Language:** TypeScript

## Features

- Real-time cryptocurrency data streaming (Binance WebSocket)
- Technical indicators (RSI, MACD, EMA, Bollinger Bands, etc.)
- Trading signals generation
- Backtesting engine
- Price alerts
- News aggregation
- User authentication & management

## Setup

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma Client
npm run prisma:generate

# Run migrations (if needed)
npm run prisma:migrate

# Start development server
npm run start:dev
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."
JWT_SECRET="..."

# Server
PORT=3000
NODE_ENV=development

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# API Keys
BINANCE_API_KEY=
BINANCE_SECRET_KEY=
```

## Deployment

### Railway

1. Create new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables
4. Deploy automatically

### Render

1. Create new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start:prod`
5. Add environment variables

## API Documentation

API documentation available at `/api/docs` when running in development mode.

## Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
