# 🖥️ CryptoBro - Aplicación de Escritorio

**Aplicación de escritorio completa** para análisis y señales de trading de criptomonedas.

---

## 🚀 Inicio Rápido

### Desarrollo (Probar la app):

```bash
cd desktop-app
npm run electron:dev
```

Esto abre la aplicación en una ventana de Electron con hot reload.

---

## 📦 Compilar el .exe

### Paso 1: Build del Backend

```bash
cd backend
npm install
npm run build
```

### Paso 2: Build del Frontend y Empaquetar

```bash
cd desktop-app
npm install
npm run electron:build
```

**Resultado**:

```
desktop-app/dist/CryptoBro-Setup-1.0.0.exe
```

---

## 📥 Instalación

1. Doble clic en `CryptoBro-Setup-1.0.0.exe`
2. Seguir el wizard de instalación
3. ¡Listo! La app se instalará en:
   ```
   C:\Users\[Usuario]\AppData\Local\Programs\CryptoBro\
   ```

---

## ⚙️ Configuración Previa

Antes de compilar, asegúrate de configurar el backend:

**backend/.env:**

```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_anon_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id

# Puerto local
PORT=3000

# Binance (opcional)
BINANCE_API_KEY=
BINANCE_SECRET_KEY=
```

---

## 🎨 Personalizar Ícono

1. Crear un ícono PNG de 256x256px
2. Convertir a .ico en https://convertio.co/png-ico/
3. Guardar como `desktop-app/build/icon.ico`
4. Rebuild: `npm run electron:build`

---

## 📂 Estructura

```
CryptoBro/
├── backend/              # NestJS API (corre localmente)
├── desktop-app/          # Electron + Next.js
│   ├── electron/         # Configuración de Electron
│   ├── build/            # Assets (ícono)
│   ├── out/              # Frontend compilado
│   └── dist/             # Instalador .exe generado
└── documentacion/        # Guías completas
```

---

## 📖 Documentación Completa

Ver [GUIA_ELECTRON_EXE.md](../documentacion/GUIA_ELECTRON_EXE.md) para:

- Arquitectura detallada
- Debugging
- Distribución
- Auto-updates
- FAQ

---

## ✨ Características

- ✅ **100% Offline** (excepto DB y APIs externas)
- ✅ **No requiere navegador**
- ✅ **Instalador profesional**
- ✅ **Backend integrado**
- ✅ **Notificaciones de Telegram**
- ✅ **Señales de trading en tiempo real**

---

## 🐛 Troubleshooting

**Error: "Cannot find module 'electron'"**

```bash
cd desktop-app
npm install
```

**Error: "Backend no inicia"**

- Verificar que `backend/dist/` existe
- Compilar backend: `cd backend && npm run build`

**DevTools no abre**

- En modo dev se abre automáticamente
- En producción: Presionar F12

---

## 📊 Scripts Disponibles

```bash
npm run dev              # Solo Next.js (desarrollo web)
npm run electron:dev     # App completa en Electron
npm run electron:build   # Build completo + instalador .exe
npm run dist:win         # Solo generar instalador
```

---

## 🎯 Próximos Pasos

1. ✅ Compilar el .exe
2. ✅ Probar instalación
3. ✅ Personalizar ícono
4. ⏳ Distribuir a otros usuarios

---

**¿Dudas?** Ver documentación completa en `/documentacion`
