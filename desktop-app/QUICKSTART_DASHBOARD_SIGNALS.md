# 🚀 Quick Start - Dashboard & Signals

## Páginas Implementadas

### 1. Dashboard Principal (`/dashboard`)

- ✅ Vista completa del mercado
- ✅ Top 5 cryptos con precios en tiempo real
- ✅ Gráfico interactivo con selección de crypto/timeframe
- ✅ Últimas 5 señales de trading
- ✅ Top 3 alertas activas
- ✅ Estadísticas del mercado (Market Cap, Volume, BTC Dominance, Fear & Greed)

### 2. Página de Signals (`/signals`)

- ✅ Lista completa de señales de trading
- ✅ Filtros avanzados (Crypto, Type, Strategy, Timeframe, Date Range)
- ✅ Búsqueda por texto
- ✅ Estadísticas (Total, Buy, Sell, Avg Confidence)
- ✅ Modal de detalles con indicadores técnicos

---

## 🏃 Comandos Rápidos

### Desarrollo

```bash
# Opción 1: Solo frontend (usa mock data)
cd desktop-app
npm run dev
# Abrir: http://localhost:3000/dashboard

# Opción 2: Con backend (datos reales)
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd desktop-app
npm run dev
```

### Testing

```bash
# Verificar compilación
cd desktop-app
npm run build

# Linting
npm run lint
```

---

## 📍 Rutas Disponibles

```
/                    → Redirect to /dashboard or /login
/login               → Login page
/dashboard           → ✨ NEW Dashboard principal
/markets             → Markets overview
/signals             → ✨ NEW Signals page
/backtesting         → Backtesting page
/news                → News page
/settings            → Settings page
```

---

## 🎨 Componentes Nuevos

### UI Components

```typescript
// Badge con variantes
<Badge variant="success">BUY</Badge>
<Badge variant="danger">SELL</Badge>
<Badge variant="warning">Warning</Badge>

// Select dropdown
<Select value={value} onChange={handleChange}>
  <option value="btc">Bitcoin</option>
</Select>

// Skeleton loader
<Skeleton className="h-20 w-full" />
```

### Dashboard Widgets

```typescript
import { CryptoListWidget } from "@/components/dashboard/crypto-list-widget";
import { TradingChart } from "@/components/dashboard/trading-chart";
import { RecentSignalsWidget } from "@/components/dashboard/recent-signals-widget";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { MarketStats } from "@/components/dashboard/market-stats";
```

### Signals Components

```typescript
import { SignalCard } from "@/components/signals/signal-card";
import { SignalFilters } from "@/components/signals/signal-filters";
import { SignalDetailsModal } from "@/components/signals/signal-details-modal";
```

---

## 🔌 API Endpoints Usados

```typescript
// Cryptos
GET /api/v1/crypto
GET /api/v1/market-data/ticker/{symbol}

// Market Data
GET /api/v1/market-data/candles/{symbol}?timeframe=4h&limit=50

// Signals
GET /api/v1/signals/recent?limit=5
GET /api/v1/signals/recent?limit=100

// Alerts
GET /api/v1/alerts
DELETE /api/v1/alerts/{id}
```

---

## 🎯 Datos Mock Disponibles

Si el backend no está disponible, los componentes usan mock data automáticamente:

- **Top Cryptos:** 5 cryptos con precios simulados
- **Chart:** 50 candlesticks generados
- **Signals:** 20 señales con indicadores completos
- **Alerts:** 2-3 alertas de ejemplo
- **Market Stats:** Datos estáticos

---

## 🐛 Troubleshooting

### "Cannot find module 'class-variance-authority'"

```bash
cd desktop-app
npm install class-variance-authority
```

### Gráfico no se muestra

```bash
# Verificar recharts
npm list recharts

# Reinstalar si es necesario
npm install recharts
```

### API Connection Error

- Verificar que el backend esté corriendo en `http://localhost:3000`
- Revisar la consola del browser para errores
- Los componentes mostrarán mock data automáticamente

### WebSocket not connecting

- El WebSocket es opcional para esta versión
- Los datos se cargarán via REST API
- Para habilitar: asegurar backend WebSocket en `ws://localhost:3000/realtime`

---

## 📱 Responsive Design

Los componentes son responsive:

### Desktop (lg+)

- Dashboard: Grid de 12 columnas (3-6-3)
- Signals: Grid de 3 columnas

### Tablet (md)

- Dashboard: Grid de 2 columnas
- Signals: Grid de 2 columnas

### Mobile (sm)

- Dashboard: Stacked (1 columna)
- Signals: Stacked (1 columna)

---

## 🔮 Features Futuras

1. **Real-time Updates**
   - WebSocket integration para precios live
   - Notificaciones de nuevas señales
   - Sound alerts

2. **Export Data**
   - Exportar señales a CSV
   - Generar reportes PDF
   - Compartir por email

3. **Advanced Filtering**
   - Guardar filtros personalizados
   - Filtros por múltiples estrategias
   - Date range picker visual

4. **Chart Improvements**
   - TradingView Lightweight Charts
   - Indicadores overlay (EMAs, Bollinger Bands)
   - Volume panel
   - Drawing tools

---

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Recharts](https://recharts.org/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## ✅ Checklist de Testing

- [ ] Dashboard carga sin errores
- [ ] Top cryptos muestran datos (mock o reales)
- [ ] Gráfico se renderiza correctamente
- [ ] Selectores de crypto/timeframe funcionan
- [ ] Últimas señales se muestran
- [ ] Alertas se pueden eliminar
- [ ] Navegación a /signals funciona
- [ ] Filtros de signals funcionan
- [ ] Modal de detalles se abre
- [ ] Búsqueda funciona
- [ ] Stats se calculan correctamente
- [ ] Responsive en mobile/tablet
- [ ] No hay errores en consola

---

**¡Todo listo para empezar a desarrollar!** 🎉

Para cualquier duda, revisar:

- `DASHBOARD_SIGNALS_IMPLEMENTATION.md` - Documentación completa
- `API_ENDPOINTS.md` - Endpoints disponibles
- `ARCHITECTURE.md` - Arquitectura del proyecto
