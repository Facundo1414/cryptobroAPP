# 🚀 Crypto Analyzer

Aplicación de análisis técnico automatizado para criptomonedas que detecta oportunidades de trading en tiempo real.

## 🎯 ¿Qué es?

**Crypto Analyzer** es una aplicación desktop que analiza mercados de criptomonedas usando las 3 estrategias de trading más efectivas del mercado (win rates 63-72%):

- 📊 **RSI + Volume Confirmation** - Detecta sobrecompra/sobreventa con confirmación de volumen
- 📈 **EMA Ribbon** - Identifica tendencias alcistas y bajistas
- 🎯 **MACD + RSI Confluence** - Encuentra puntos de entrada y salida óptimos

### Características principales

- 🔔 **Alertas en tiempo real** cuando detecta oportunidades
- 📊 **Dashboard interactivo** con gráficos y señales
- 📈 **Backtesting** para validar estrategias con datos históricos
- 🔐 **Autenticación segura**
- 🌐 **Actualizaciones automáticas**

**⚠️ IMPORTANTE**: Esta app NO ejecuta trades automáticos. Solo proporciona análisis y alertas para que tú operes manualmente.

---

## 💾 Instalación

### Opción 1: Instalador (Recomendado)

1. Ve a [**Releases**](https://github.com/Facundo1414/cryptobroAPP/releases/latest)
2. Descarga `CryptoBro-Setup-1.1.0.exe`
3. Ejecuta el instalador y sigue las instrucciones
4. ✅ Listo! La app se actualizará automáticamente cuando haya nuevas versiones

### Opción 2: Desarrollo Local

Si quieres compilar desde código fuente:

```bash
# Clonar el repositorio
git clone https://github.com/Facundo1414/cryptobroAPP.git
cd cryptobro

# Instalar dependencias
npm install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Edita backend/.env con tus credenciales de Supabase

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

**Prerequisitos de desarrollo:**

- Node.js >= 18.x
- npm >= 9.x
- Electron >= 40.x (se instala automáticamente)

---

## 📚 Documentación Adicional

Para documentación completa de desarrollo, arquitectura y configuración avanzada, consulta la carpeta `/git ignore/documentacion/`.

---

## ⚠️ Disclaimer

Esta aplicación es una herramienta de ANÁLISIS únicamente. No ejecuta operaciones automáticas.
No constituye asesoría financiera. El usuario es responsable de sus decisiones de inversión.

## 📝 Licencia

Privado - Uso personal
