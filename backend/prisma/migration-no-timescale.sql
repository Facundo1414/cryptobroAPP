-- Migration SQL for Crypto Analyzer Database (SIN TimescaleDB)
-- Execute this script in your Supabase SQL Editor
-- 
-- IMPORTANT: This uses Supabase Authentication (auth.users)
-- Version WITHOUT TimescaleDB (compatible with all Supabase plans)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (syncs with auth.users)
-- ============================================

-- Users table (additional data, auth is handled by Supabase auth.users)
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID NOT NULL PRIMARY KEY, -- References auth.users(id)
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "avatar_url" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "is_premium" BOOLEAN NOT NULL DEFAULT false,
  "premium_until" TIMESTAMP(3),
  "last_login" TIMESTAMP(3),
  "preferences" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CRYPTOCURRENCY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "cryptocurrencies" (
  "id" SERIAL PRIMARY KEY,
  "symbol" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "price" DECIMAL(20,8),
  "volume" DECIMAL(20,2),
  "market_cap" DECIMAL(20,2),
  "price_change_percent" DECIMAL(10,4),
  "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ENUMS
-- ============================================

-- Alert status enum
DO $$ BEGIN
  CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Alert type enum  
DO $$ BEGIN
  CREATE TYPE "AlertType" AS ENUM ('PRICE_ABOVE', 'PRICE_BELOW', 'PRICE_CHANGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Signal type enum
DO $$ BEGIN
  CREATE TYPE "SignalType" AS ENUM ('BUY', 'SELL', 'HOLD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "alerts" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "crypto_id" INTEGER NOT NULL,
  "type" "AlertType" NOT NULL,
  "condition" TEXT,
  "target_price" DECIMAL(20,8),
  "current_price" DECIMAL(20,8),
  "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
  "notify_email" BOOLEAN NOT NULL DEFAULT false,
  "notify_push" BOOLEAN NOT NULL DEFAULT false,
  "triggered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "alerts_crypto_id_fkey" FOREIGN KEY ("crypto_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE
);

-- ============================================
-- SIGNALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "signals" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "crypto_id" INTEGER NOT NULL,
  "type" "SignalType" NOT NULL,
  "strategy" TEXT NOT NULL,
  "price" DECIMAL(20,8) NOT NULL,
  "confidence" DECIMAL(5,2) NOT NULL,
  "indicators" JSONB,
  "reason" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "signals_crypto_id_fkey" FOREIGN KEY ("crypto_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE
);

-- ============================================
-- STRATEGIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "strategies" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "indicators" JSONB NOT NULL,
  "conditions" JSONB NOT NULL,
  "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "strategies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ============================================
-- BACKTESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "backtests" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "strategy_id" UUID NOT NULL,
  "crypto_id" INTEGER NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "initial_capital" DECIMAL(20,2) NOT NULL,
  "results" JSONB NOT NULL,
  "metrics" JSONB NOT NULL,
  "trades" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backtests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "backtests_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE,
  CONSTRAINT "backtests_crypto_id_fkey" FOREIGN KEY ("crypto_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE
);

-- ============================================
-- WATCHLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "watchlist_items" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "crypto_id" INTEGER NOT NULL,
  "notes" TEXT,
  "target_price" DECIMAL(20,8),
  "alert_enabled" BOOLEAN NOT NULL DEFAULT false,
  "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "watchlist_items_crypto_id_fkey" FOREIGN KEY ("crypto_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE,
  CONSTRAINT "watchlist_items_user_id_crypto_id_key" UNIQUE("user_id", "crypto_id")
);

-- ============================================
-- NEWS ARTICLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "news_articles" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "content" TEXT,
  "source" TEXT NOT NULL,
  "url" TEXT,
  "image_url" TEXT,
  "published_at" TIMESTAMP(3) NOT NULL,
  "sentiment" DECIMAL(5,2),
  "categories" TEXT[],
  "related_cryptos" TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CANDLES TABLE (Regular table - NO TimescaleDB)
-- ============================================

CREATE TABLE IF NOT EXISTS "candles" (
  "id" SERIAL PRIMARY KEY,
  "crypto_id" INTEGER NOT NULL,
  "open_time" TIMESTAMP(3) NOT NULL,
  "open" DECIMAL(20,8) NOT NULL,
  "high" DECIMAL(20,8) NOT NULL,
  "low" DECIMAL(20,8) NOT NULL,
  "close" DECIMAL(20,8) NOT NULL,
  "volume" DECIMAL(20,2) NOT NULL,
  "close_time" TIMESTAMP(3) NOT NULL,
  "interval" TEXT NOT NULL DEFAULT '1h',
  CONSTRAINT "candles_crypto_id_fkey" FOREIGN KEY ("crypto_id") REFERENCES "cryptocurrencies"("id") ON DELETE CASCADE,
  CONSTRAINT "candles_crypto_id_open_time_interval_key" UNIQUE("crypto_id", "open_time", "interval")
);

-- NOTE: Using regular table instead of TimescaleDB hypertable
-- This works for most use cases. For production with millions of candles,
-- consider upgrading to a Supabase plan with TimescaleDB or use a separate
-- time-series database.

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS "alerts_user_id_idx" ON "alerts"("user_id");
CREATE INDEX IF NOT EXISTS "alerts_crypto_id_idx" ON "alerts"("crypto_id");
CREATE INDEX IF NOT EXISTS "alerts_status_idx" ON "alerts"("status");

CREATE INDEX IF NOT EXISTS "signals_user_id_idx" ON "signals"("user_id");
CREATE INDEX IF NOT EXISTS "signals_crypto_id_idx" ON "signals"("crypto_id");
CREATE INDEX IF NOT EXISTS "signals_created_at_idx" ON "signals"("created_at");

CREATE INDEX IF NOT EXISTS "strategies_user_id_idx" ON "strategies"("user_id");

CREATE INDEX IF NOT EXISTS "backtests_user_id_idx" ON "backtests"("user_id");
CREATE INDEX IF NOT EXISTS "backtests_strategy_id_idx" ON "backtests"("strategy_id");

CREATE INDEX IF NOT EXISTS "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");
CREATE INDEX IF NOT EXISTS "watchlist_items_crypto_id_idx" ON "watchlist_items"("crypto_id");

CREATE INDEX IF NOT EXISTS "news_articles_published_at_idx" ON "news_articles"("published_at");

-- Indexes for candles table (important for performance)
CREATE INDEX IF NOT EXISTS "candles_crypto_id_idx" ON "candles"("crypto_id");
CREATE INDEX IF NOT EXISTS "candles_open_time_idx" ON "candles"("open_time" DESC);
CREATE INDEX IF NOT EXISTS "candles_crypto_id_open_time_idx" ON "candles"("crypto_id", "open_time" DESC);
CREATE INDEX IF NOT EXISTS "candles_interval_idx" ON "candles"("interval");

CREATE INDEX IF NOT EXISTS "cryptocurrencies_symbol_idx" ON "cryptocurrencies"("symbol");

-- ============================================
-- TRIGGERS
-- ============================================

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to strategies table
DROP TRIGGER IF EXISTS update_strategies_updated_at ON "strategies";
CREATE TRIGGER update_strategies_updated_at 
  BEFORE UPDATE ON "strategies"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert some initial cryptocurrencies
INSERT INTO "cryptocurrencies" ("symbol", "name", "price", "volume", "market_cap", "price_change_percent")
VALUES
  ('BTC', 'Bitcoin', 65000.00, 25000000000, 1275000000000, 2.5),
  ('ETH', 'Ethereum', 3500.00, 12000000000, 420000000000, 3.2),
  ('BNB', 'Binance Coin', 550.00, 1500000000, 82500000000, 1.8),
  ('SOL', 'Solana', 145.00, 2500000000, 60000000000, 5.7),
  ('ADA', 'Cardano', 0.62, 800000000, 21700000000, -1.2),
  ('XRP', 'Ripple', 0.55, 1200000000, 30250000000, 0.8),
  ('DOT', 'Polkadot', 7.50, 400000000, 9750000000, -0.5),
  ('DOGE', 'Dogecoin', 0.085, 600000000, 12325000000, 2.1),
  ('AVAX', 'Avalanche', 38.00, 500000000, 14060000000, 4.3),
  ('MATIC', 'Polygon', 0.88, 350000000, 8184000000, 3.6)
ON CONFLICT ("symbol") DO UPDATE SET
  "price" = EXCLUDED."price",
  "volume" = EXCLUDED."volume",
  "market_cap" = EXCLUDED."market_cap",
  "price_change_percent" = EXCLUDED."price_change_percent",
  "last_updated" = CURRENT_TIMESTAMP;

-- ============================================
-- RLS POLICIES (Security)
-- ============================================

-- Enable RLS on tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "strategies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "backtests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "watchlist_items" ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON "users"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "users"
  FOR UPDATE USING (auth.uid() = id);

-- Users can only manage their own alerts
CREATE POLICY "Users can view own alerts" ON "alerts"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts" ON "alerts"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON "alerts"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON "alerts"
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only manage their own signals
CREATE POLICY "Users can view own signals" ON "signals"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own signals" ON "signals"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only manage their own strategies
CREATE POLICY "Users can view own strategies" ON "strategies"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own strategies" ON "strategies"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" ON "strategies"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" ON "strategies"
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only manage their own backtests
CREATE POLICY "Users can view own backtests" ON "backtests"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backtests" ON "backtests"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only manage their own watchlist
CREATE POLICY "Users can view own watchlist" ON "watchlist_items"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watchlist items" ON "watchlist_items"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items" ON "watchlist_items"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items" ON "watchlist_items"
  FOR DELETE USING (auth.uid() = user_id);

-- Everyone can read cryptocurrencies and news
CREATE POLICY "Anyone can view cryptocurrencies" ON "cryptocurrencies"
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view news" ON "news_articles"
  FOR SELECT USING (true);

-- Everyone can read candles (public market data)
CREATE POLICY "Anyone can view candles" ON "candles"
  FOR SELECT USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database migration completed successfully!';
  RAISE NOTICE '📊 Created 9 tables with proper indexes and RLS policies';
  RAISE NOTICE '🔐 Configured auth.users sync trigger';
  RAISE NOTICE '💰 Inserted 10 initial cryptocurrencies';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify tables in Table Editor';
  RAISE NOTICE '2. Update backend/.env with correct credentials';
  RAISE NOTICE '3. Run: cd backend && npx prisma db pull';
  RAISE NOTICE '4. Run: npm run start:dev';
END $$;
