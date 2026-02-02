# 🔒 Seguridad y Configuración

## ⚠️ IMPORTANTE: Antes de Usar

### Credenciales y Archivos Sensibles

Este proyecto requiere configuración de credenciales. **NUNCA** hagas commit de:

- ❌ Archivos `.env`
- ❌ Claves API privadas
- ❌ Contraseñas de bases de datos
- ❌ JWT secrets
- ❌ Service keys de Supabase

### Configuración Inicial

1. **Copia el archivo de ejemplo**:

```bash
cp backend/.env.example backend/.env
```

2. **Configura tus propias credenciales**:
   - Ve a [Supabase](https://supabase.com) y crea un proyecto
   - Copia tus credenciales al archivo `.env`
   - Genera un JWT_SECRET único: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`

3. **Verifica que `.env` esté en `.gitignore`** (ya está configurado)

## 🔐 ¿Qué Hacer si Expusiste Credenciales?

Si accidentalmente hiciste commit de credenciales:

1. **Rotación Inmediata de Credenciales**:
   - Regenera todas las claves en Supabase
   - Cambia el password de la base de datos
   - Genera un nuevo JWT_SECRET

2. **Limpia el Historial de Git** (opcional, avanzado):

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

3. **Force Push** (⚠️ CUIDADO - solo si es tu repo personal):

```bash
git push origin --force --all
```

## 🛡️ Buenas Prácticas

- ✅ Usa el archivo `.env.example` como plantilla
- ✅ Mantén secretos localmente en `.env`
- ✅ Usa variables de entorno en producción (Railway, Vercel, etc.)
- ✅ Rota credenciales periódicamente
- ✅ Limita los permisos de API keys (solo lectura cuando sea posible)

## 📱 Seguridad de la App Desktop

La app desktop incluye:

- ✅ Comunicación encriptada (HTTPS/WSS)
- ✅ Tokens JWT con expiración
- ✅ Refresh tokens seguros
- ✅ No almacena credenciales sensibles en texto plano

## 🔒 APIs Opcionales

Las siguientes APIs son **opcionales** y funcionan sin keys:

- **Binance**: Usa endpoints públicos para precios
- **CryptoPanic**: Tiene tier gratuito sin autenticación
- **CoinGecko**: API pública gratuita

Solo añade keys si necesitas límites más altos o funciones premium.
