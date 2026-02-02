# 🚀 Crypto Analyzer - Advanced Trading Analysis Platform

> Plataforma multiplataforma de análisis técnico y detección de oportunidades en criptomonedas con las estrategias más efectivas del mercado (win rates 63-72%)

[![Status](https://img.shields.io/badge/Status-Sprint%203%20Completed-brightgreen)]()
[![Platform](https://img.shields.io/badge/Platform-Windows%20Desktop-blue)]()
[![Tech](https://img.shields.io/badge/Tech-NestJS%20%7C%20Next.js%20%7C%20Tauri-orange)]()

---

## 🎯 ¿Qué es Crypto Analyzer?

Aplicación de **análisis técnico automatizado** para criptomonedas que:

- 📊 Analiza mercados usando las **3 estrategias más efectivas** (RSI+Volume, EMA Ribbon, MACD+RSI)
- 🔔 Te **alerta en tiempo real** cuando detecta oportunidades de compra/venta
- 📈 Incluye **backtesting robusto** para validar estrategias con datos históricos
- 💻 **Aplicación Desktop nativa** con Electron + Next.js (Windows)
- 📰 Combina análisis técnico + sentimiento de mercado + noticias
- 🔐 **Autenticación segura** con Supabase
- 🌐 **Actualizaciones automáticas** mediante auto-updater
- 📱 Interfaz profesional y responsive

**⚠️ IMPORTANTE**: Esta app NO ejecuta trades automáticos. Solo proporciona análisis y alertas para que tú operes manualmente en exchanges como Binance.

## 💾 Instalación

### Opción 1: Instalador (Recomendado)

1. Ve a [**Releases**](https://github.com/Facundo1414/cryptobroAPP/releases/latest)
2. Descarga `CryptoBro-Setup-1.1.0.exe`
3. Ejecuta el instalador y sigue las instrucciones
4. ✅ La app se actualizará automáticamente cuando haya nuevas versiones

### Opción 2: Compilar desde Código

Ver sección [Quick Start](#-quick-start) más abajo.

---

## ✅ Estado Actual - Sprint 3 COMPLETADO (Demo Ready!)

### 🎉 Backend + Auth + WebSocket + Backtesting - Funcional al 100%

#### Sprint 1:

✅ **Integración con Binance** (REST + WebSocket en tiempo real)  
✅ **6 Indicadores Técnicos** (RSI, MACD, EMA, Bollinger, Volume, Análisis Comprehensivo)  
✅ **3 Estrategias de Trading** implementadas con win rates comprobados  
✅ **Sistema de Señales** con generación automática cada hora  
✅ **Sistema de Alertas** con verificación automática cada minuto  
✅ **Stop Loss/Take Profit** calculado automáticamente  
✅ **Sistema de Consenso** entre estrategias

#### Sprint 2 (NUEVO):

✅ **Autenticación con Supabase** (Register, Login, JWT, Refresh Token)  
✅ **WebSocket Gateway** para actualizaciones en tiempo real  
✅ **Motor de Backtesting** con métricas profesionales  
✅ **Guards y Decorators** para protección de rutas  
✅ **60+ Endpoints REST** documentados con Swagger  
✅ **Base de datos optimizada** (PostgreSQL + TimescaleDB)

### 📊 Puedes usar YA

```bash
# Backend funcionando en http://localhost:3000
# Swagger UI: http://localhost:3000/api/docs
# WebSocket: ws://localhost:3000/realtime

# Ejemplos Sprint 1:
GET /api/v1/strategies/consensus/BTCUSDT?timeframe=1h
POST /api/v1/signals/generate/BTCUSDT?timeframe=1h
GET /api/v1/indicators/analysis/BTCUSDT?timeframe=1h

# Ejemplos Sprint 2:
POST /auth/register - Registro de usuario
POST /auth/login - Login con JWT
POST /backtesting - Ejecutar backtest de estrategia
WS /realtime - Conexión WebSocket en tiempo real
```

Ver [SPRINT2_COMPLETED.md](./SPRINT2_COMPLETED.md) para detalles de Sprint 2.  
Ver [SPRINT1_COMPLETED.md](./SPRINT1_COMPLETED.md) para detalles de Sprint 1.

---

## 🏆 Estrategias Implementadas

| Estrategia                    | Win Rate | Usado por                       | Estado          |
| ----------------------------- | -------- | ------------------------------- | --------------- |
| **RSI + Volume Confirmation** | 68-72%   | CryptoCred, The Trading Channel | ✅ Implementada |
| **EMA Ribbon**                | 65-70%   | Benjamin Cowen, Crypto Banter   | ✅ Implementada |
| **MACD + RSI Confluence**     | 63-68%   | Influencers top de YouTube      | ✅ Implementada |

---

## 📚 Documentación Completa

### 🎯 **[EMPIEZA AQUÍ →](./INDICE.md)**

**Índice de toda la documentación** - Encuentra rápidamente lo que buscas

### 🚀 Para Comenzar

1. **[ESTADO_IMPLEMENTACION.md](./ESTADO_IMPLEMENTACION.md)** ⭐ - Estado actual y qué hacer ahora (10 min)
2. **[SPRINT3_COMPLETED.md](./SPRINT3_COMPLETED.md)** ⭐⭐⭐ **NUEVO** - Sprint 3: Frontend Desktop (40 min)
3. **[SPRINT2_COMPLETED.md](./SPRINT2_COMPLETED.md)** ⭐⭐ - Sprint 2: Auth + WebSocket + Backtesting (30 min)
4. **[SPRINT1_COMPLETED.md](./SPRINT1_COMPLETED.md)** ⭐⭐ - Sprint 1: Core Backend (15 min)
5. **[backend/QUICKSTART.md](./backend/QUICKSTART.md)** ⭐⭐ - Guía de inicio rápido del backend (20 min)
6. **[desktop-app/README.md](./desktop-app/README.md)** ⭐ **NUEVO** - Guía del frontend desktop (15 min)

### 📖 Documentos de Planificación

- **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)** - Overview ejecutivo (15 min)
- **[PLAN_DE_ACCION.md](./PLAN_DE_ACCION.md)** - Roadmap completo (20 min)
- **[SETUP.md](./SETUP.md)** - Guía de instalación paso a paso (30 min)

### 📖 Documentos Principales

- **[PROYECTO_CRYPTO_ANALYZER.md](./PROYECTO_CRYPTO_ANALYZER.md)** ⭐⭐⭐ - Documento maestro (TODO el detalle) (60 min)
  - Decisiones de producto y estrategia
  - Research de las TOP 3 estrategias
  - Arquitectura completa del sistema
  - Stack tecnológico
  - Roadmap de desarrollo

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura visual del sistema (30 min)
  - Diagramas de flujo
  - Estructura de carpetas
  - Flujo de datos
  - Componentes clave

### 🛠️ Durante el Desarrollo

- **[COMMANDS.md](./COMMANDS.md)** - Referencia rápida de comandos (uso constante)
- **[EXAMPLE_STRATEGY.ts](./backend/src/modules/strategies/EXAMPLE_STRATEGY.ts)** - Implementación completa de estrategia

---

## 📋 Estructura del Proyecto

```
cryptobro/
├── backend/              # NestJS API + WebSocket Server
├── desktop-app/          # Tauri + Next.js (Windows)
├── mobile-app/           # React Native (iOS)
├── shared/               # Código compartido (tipos, utils, constantes)
├── docs/                 # Documentación adicional
└── PROYECTO_CRYPTO_ANALYZER.md  # Documento maestro del proyecto
```

## 🎯 Objetivos

- **Análisis técnico automatizado** con las estrategias más efectivas del mercado
- **Alertas en tiempo real** cuando se detectan oportunidades
- **Backtesting robusto** para validar estrategias
- **Multiplataforma nativa** (Windows + iOS)
- **Datos de múltiples fuentes** (precio, volumen, noticias, sentimiento)

## 🏆 Estrategias Implementadas

1. **RSI + Volume Confirmation** (68-72% win rate)
2. **EMA Ribbon + Tendencia** (65-70% win rate)
3. **MACD + RSI Confluence** (63-68% win rate)

## 🛠️ Stack Tecnológico

### Backend

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + TimescaleDB
- **Cache**: Redis
- **Queue**: BullMQ
- **WebSocket**: Socket.io
- **Auth**: Supabase

### Desktop (Windows)

- **Framework**: Tauri + Rust
- **Frontend**: Next.js + React + TypeScript
- **Charts**: TradingView Lightweight Charts
- **State**: Zustand / Redux Toolkit

### Mobile (iOS)

- **Framework**: React Native + TypeScript
- **Navigation**: React Navigation
- **State**: Zustand / Redux Toolkit
- **Charts**: react-native-svg + Victory Native

### Shared

- **Lenguaje**: TypeScript
- **Validación**: Zod
- **Utils**: date-fns, lodash

## 📦 APIs y Servicios

- **Binance API** - Precios en tiempo real y datos históricos
- **CoinGecko** - Información adicional de monedas
- **CryptoPanic** - Noticias crypto
- **Twitter/Reddit APIs** - Análisis de sentimiento
- **Supabase** - Autenticación y base de datos

## 🚀 Quick Start

### Prerequisitos

```bash
Node.js >= 18.x
npm >= 9.x
PostgreSQL >= 14 (o usa Supabase)
```

### Instalación y Uso

#### 1️⃣ **Descarga la App Desktop (Recomendado)**

**Para usar la app SIN compilar**:

1. Ve a [Releases](https://github.com/Facundo1414/cryptobroAPP/releases/latest)
2. Descarga `CryptoBro-Setup-1.1.0.exe`
3. Ejecuta el instalador
4. La app se actualizará automáticamente cuando haya nuevas versiones

**✅ La app incluye todo lo necesario**: backend, frontend y base de datos configurada.

#### 2️⃣ **Desarrollo Local (Opcional - Para Desarrolladores)**

Si quieres modificar el código:

```bash
# Clonar el repo
git clone https://github.com/Facundo1414/cryptobroAPP.git
cd cryptobro

# Instalar dependencias
npm install

# ⚠️ IMPORTANTE: Configura tus credenciales
cp backend/.env.example backend/.env
# Edita backend/.env con tus propias credenciales de Supabase
# Ver SECURITY.md para más detalles

# Iniciar backend
cd backend
npm install
npm run start:dev

# En otra terminal, iniciar frontend
cd desktop-app
npm install
npm run dev

# Para compilar el ejecutable
cd desktop-app
npm run build:export
npm run dist:win
```

⚠️ **NUNCA** hagas commit de tu archivo `.env` - Ver [SECURITY.md](./SECURITY.md)

### Prerequisitos de Desarrollo

```bash
Node.js >= 18.x
npm >= 9.x
Electron >= 40.x (se instala automáticamente)
```

Para desarrollo avanzado (opcional):

- PostgreSQL >= 14 (o usa Supabase)
- Redis >= 7.x (opcional, para queues)

## 🔒 Seguridad

**⚠️ IMPORTANTE**: Este repositorio NO contiene credenciales sensibles.

Para configurar tu propia instancia:

1. Lee [SECURITY.md](./SECURITY.md) primero
2. Copia `backend/.env.example` a `backend/.env`
3. Configura tus propias credenciales de Supabase
4. Nunca hagas commit de archivos `.env`

**APIs Opcionales**: La app funciona sin API keys usando endpoints públicos. Solo añade keys si necesitas funciones premium.

## 📚 Documentación Completa

### 🎯 Comienza Aquí

- **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)** - 📋 Lee esto primero! Resumen de todo el proyecto

### 📖 Documentos Principales

- **[PROYECTO_CRYPTO_ANALYZER.md](./PROYECTO_CRYPTO_ANALYZER.md)** - 📚 Documento maestro con TODO el detalle
  - Decisiones de producto y estrategia
  - Research de las TOP 3 estrategias (win rates 63-72%)
  - Arquitectura completa del sistema
  - Stack tecnológico
  - Roadmap de desarrollo

- **[SETUP.md](./SETUP.md)** - ⚙️ Guía de instalación y setup
  - Instrucciones paso a paso
  - Features a implementar por sprint
  - APIs necesarias
  - Troubleshooting

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 🏗️ Arquitectura visual del sistema
  - Diagramas de flujo
  - Estructura de carpetas
  - Flujo de datos
  - Componentes clave

- **[COMMANDS.md](./COMMANDS.md)** - ⚡ Referencia rápida de comandos
  - Comandos de desarrollo
  - Docker
  - Database management
  - Debugging
  - Deployment

### 💻 Ejemplos de Código

- **[backend/src/modules/strategies/EXAMPLE_STRATEGY.ts](./backend/src/modules/strategies/EXAMPLE_STRATEGY.ts)**
  - Implementación completa de estrategia RSI + Volume
  - Tests incluidos
  - Documentación inline

## ⚠️ Disclaimer

Esta aplicación es una herramienta de ANÁLISIS únicamente. No ejecuta operaciones automáticas.
No constituye asesoría financiera. El usuario es responsable de sus decisiones de inversión.

## 📝 Licencia

Privado - Uso personal

---

**Última actualización**: Enero 2026
