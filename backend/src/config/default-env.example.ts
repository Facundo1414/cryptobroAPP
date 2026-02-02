/**
 * Default environment configuration TEMPLATE
 *
 * IMPORTANT: This is a template file. The actual credentials are stored in:
 * - default-env.ts (local only, not in git)
 *
 * To compile the installer, you need to create default-env.ts with real credentials:
 * 1. Copy this file to default-env.ts
 * 2. Replace all placeholder values with real credentials
 * 3. Run: npm run build (backend) -> npm run dist:win (desktop-app)
 *
 * The compiled installer will have these credentials embedded, but they won't
 * be exposed in the GitHub repository.
 */
export const DEFAULT_ENV = {
  // Database - Supabase
  DATABASE_URL:
    "postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  DIRECT_URL:
    "postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres",

  // JWT
  JWT_SECRET: "YOUR_RANDOM_SECRET_KEY_HERE_AT_LEAST_64_CHARS",
  JWT_EXPIRATION: "7d",

  // Supabase
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  SUPABASE_SERVICE_KEY: "YOUR_SUPABASE_SERVICE_ROLE_KEY",

  // Redis (optional)
  BULL_REDIS_HOST: "localhost",
  BULL_REDIS_PORT: "6379",

  // Server
  PORT: "3000",
  NODE_ENV: "production",
  FRONTEND_URL: "http://localhost:4001",

  // APIs (optional - users can add their own)
  BINANCE_API_KEY: "",
  BINANCE_API_SECRET: "",
  CRYPTOPANIC_API_KEY: "",
  NEWS_API_KEY: "",
};
