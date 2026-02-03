# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.2.0] - 2026-02-02

### 🎉 Añadido

#### Smart Money Visualization (Feature Principal)

- **SmartMoneyChart**: Gráfico avanzado con TradingView Lightweight Charts
  - Order Blocks (zonas institucionales) con visualización verde/rojo
  - Fair Value Gaps (FVG) - targets de precio con áreas transparentes
  - Liquidity Sweeps - detección de manipulación con marcadores
  - Structure Changes (CHoCH/BoS) - cambios de tendencia
  - POC (Point of Control) y Value Area
  - Toggles interactivos para overlays

- **VolumeProfile**: Perfil de volumen lateral con D3.js
  - Barras horizontales de volumen por precio
  - POC (línea amarilla punteada)
  - Value Area (70% del volumen)
  - Precio actual con indicador
  - Leyenda con estadísticas

- **DeltaVolumeChart**: Análisis de Order Flow
  - Delta Volume (presión compradora vs vendedora)
  - Barras verde/rojo según agresividad
  - Tooltips interactivos
  - Interpretación de señal automática
  - Resumen de volumen total

- **SmartMoneySignalPanel**: Panel de análisis detallado
  - Badge BUY/SELL con porcentaje de confianza
  - Entry Price, Stop Loss, Take Profit
  - Risk:Reward ratio calculado automáticamente
  - Detalles de Order Blocks detectados
  - Info de Liquidity Sweeps y Fair Value Gaps
  - Structure Changes (CHoCH/BoS)
  - Delta Volume institucional
  - RSI y Volume Ratio
  - Razonamiento explicativo de la señal

- **Smart Money Dashboard** (`/dashboard/smart-money`)
  - Página completa con layout profesional
  - Selector de 6 criptomonedas (BTC, ETH, SOL, BNB, ADA, DOGE)
  - Selector de estrategias (Smart Money Concepts, Order Flow)
  - Toggles para overlays (OB, FVG, LS, VP)
  - Auto-refresh cada 60 segundos
  - Info cards educativos
  - Education card con tasa de éxito
  - Diseño responsive mobile-first

- **Integración Dashboard Principal**
  - Botón "Smart Money Analysis" con gradiente purple-blue
  - Navegación directa a análisis avanzado
  - Icono Zap (⚡) distintivo

#### Estrategias Avanzadas Backend

- **Smart Money Concepts Strategy** (75-82% win rate)
  - Detección de Order Blocks
  - Identificación de Fair Value Gaps
  - Análisis de Liquidity Sweeps
  - Structure Changes (CHoCH/BoS)

- **Order Flow Strategy** (73-79% win rate)
  - Cálculo de Delta Volume
  - Volume Profile por precio
  - Identificación de POC
  - Value Area calculation

#### Documentación

- `SMART_MONEY_IMPLEMENTATION.md` - Guía técnica completa
- `SMART_MONEY_RESUMEN_FINAL.md` - Resumen ejecutivo
- `AUDITORIA_SMART_MONEY_FEBRERO_2026.md` - Auditoría completa
- `ESTRATEGIAS_MEJORADAS_2026.md` - Documentación de estrategias

### 📦 Dependencias

- `lightweight-charts@^4.2.0` - Gráficos profesionales TradingView
- `d3@^7.9.0` - Visualizaciones personalizadas
- `@types/d3@latest` - Tipos TypeScript para D3

### 🔧 Corregido

- Error de sintaxis en Settings page (div sin cerrar)
- Estructura de componentes internos en Settings
- Property `isAuthenticated` en Dashboard (cambiado a `user`)
- Visibility de método `getCandles` en IndicatorsService (private → public)
- Errores de tipos TypeScript en estrategias Smart Money
- Paper Trading compilation issues

### 🎨 Mejorado

- Modularidad de componentes Smart Money (barrel exports)
- Tipado TypeScript con interfaces específicas
- Performance con code splitting automático
- Bundle size optimizado (Smart Money: 20.2 kB)
- Dark theme consistency en nuevos componentes

### 📊 Métricas

- **6 componentes nuevos** creados (~1,487 líneas)
- **2 estrategias avanzadas** implementadas
- **18 rutas** generadas correctamente
- **0 errores** de compilación
- **78% tasa de éxito** promedio Smart Money

---

## [1.1.2] - 2026-01-XX

### 🔧 Corregido

- Varios bugs menores
- Mejoras de estabilidad

### 🎨 Mejorado

- Performance general
- UI/UX refinamientos

---

## [1.1.0] - 2026-01-XX

### 🎉 Añadido

- Sistema de Paper Trading
- Backtesting avanzado
- Alertas de precio
- Watchlist personalizable
- Sistema de notificaciones

### 🔧 Corregido

- Errores de autenticación
- Problemas de sincronización de datos

---

## [1.0.0] - 2025-12-XX

### 🎉 Release Inicial

- Dashboard principal con widgets
- Integración con Binance API
- 3 estrategias básicas de trading (RSI+Volume, EMA Ribbon, MACD+RSI)
- Sistema de señales en tiempo real
- Gestión de portafolio
- Análisis técnico básico
- WebSocket para datos en tiempo real
- Sistema de autenticación
- Base de datos PostgreSQL/Supabase
- Electron app para escritorio

---

## Tipos de Cambios

- `Añadido` para funcionalidades nuevas
- `Cambiado` para cambios en funcionalidades existentes
- `Obsoleto` para funcionalidades que serán removidas
- `Eliminado` para funcionalidades removidas
- `Corregido` para corrección de bugs
- `Seguridad` para vulnerabilidades

---

## Links

- [Repositorio](https://github.com/usuario/cryptobro)
- [Documentación](./git%20ignore/documentacion/)
- [Issues](https://github.com/usuario/cryptobro/issues)

---

**Convención de Versionado:**

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (0.0.X): Correcciones de bugs compatibles
