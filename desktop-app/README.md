# Crypto Analyzer - Desktop App

Desktop application for Crypto Analyzer built with Tauri + Next.js 14.

## Features

- ✅ **Authentication** - Login/Register with Supabase
- ✅ **Real-time Updates** - WebSocket integration
- ✅ **Market Overview** - Live cryptocurrency prices
- ✅ **Trading Signals** - Buy/Sell signals with confidence scores
- ✅ **Price Charts** - Interactive candlestick charts (Lightweight Charts)
- ✅ **Alerts Management** - Price alerts and notifications
- ✅ **Dark Mode** - Beautiful dark theme with Tailwind CSS
- ✅ **State Management** - Zustand for efficient state handling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Desktop**: Tauri (Rust)
- **UI**: Tailwind CSS + Radix UI
- **Charts**: Lightweight Charts
- **State**: Zustand
- **Auth**: Supabase
- **WebSocket**: Socket.io Client

## Prerequisites

- Node.js 18+
- pnpm
- Rust (for Tauri)
- Backend running on http://localhost:3000

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your configuration
```

## Development

```bash
# Run Next.js dev server
pnpm dev

# Run with Tauri (desktop app)
pnpm tauri:dev
```

## Build

```bash
# Build Next.js
pnpm build

# Build Tauri desktop app
pnpm tauri:build
```

The built application will be in `src-tauri/target/release/`.

## Project Structure

```
desktop-app/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── dashboard/       # Dashboard page
│   │   ├── login/           # Login page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── dashboard/       # Dashboard components
│   │   ├── layout/          # Layout components
│   │   ├── ui/              # UI components
│   │   └── providers.tsx    # React providers
│   ├── lib/
│   │   ├── api-client.ts    # API client with interceptors
│   │   └── utils.ts         # Utility functions
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   └── websocket-provider.tsx
│   └── stores/
│       ├── auth-store.ts    # Authentication state
│       └── market-data-store.ts  # Market data state
├── src-tauri/               # Tauri configuration
├── public/                  # Static assets
└── package.json
```

## Components

### Dashboard Components

- **MarketOverview** - Grid of cryptocurrency cards with prices
- **TradingSignals** - List of trading signals with buy/sell indicators
- **PriceChart** - Candlestick chart using Lightweight Charts
- **AlertsList** - Active alerts with real-time notifications

### UI Components

- Button, Input, Label, Card - Basic UI components
- DashboardLayout - Sidebar layout with navigation

## State Management

### Auth Store (`useAuthStore`)

- User authentication state
- Login/Register/Logout
- Token management with automatic refresh

### Market Data Store (`useMarketDataStore`)

- Real-time price updates
- Trading signals
- Alert notifications

## API Integration

All API calls are handled through `api-client.ts`:

```typescript
import { authApi, marketDataApi, signalsApi } from "@/lib/api-client";

// Example usage
const signals = await signalsApi.getRecent(10, "BTC");
const price = await marketDataApi.getCurrentPrice("BTCUSDT");
```

## WebSocket Integration

WebSocket provider automatically connects when user is authenticated:

```typescript
// Subscribes to:
- prices channel (real-time price updates)
- signals channel (new trading signals)
- alerts channel (alert notifications)
```

## Styling

Using Tailwind CSS with custom theme:

- Dark mode by default
- Purple accent color
- Responsive design
- Custom animations

## Troubleshooting

### Backend connection issues

- Ensure backend is running on http://localhost:3000
- Check NEXT_PUBLIC_API_URL in .env.local

### WebSocket not connecting

- Check NEXT_PUBLIC_WS_URL in .env.local
- Ensure user is authenticated
- Check browser console for errors

### Build errors

- Run `pnpm install` to ensure dependencies are installed
- Clear `.next` folder and rebuild
- For Tauri, ensure Rust is properly installed

## Next Steps

- [ ] Add more pages (Backtesting, Settings, etc.)
- [ ] Implement chart indicators overlay
- [ ] Add portfolio tracking
- [ ] Implement notifications system
- [ ] Add keyboard shortcuts

## License

Private - All rights reserved
