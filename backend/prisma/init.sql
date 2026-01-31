-- TimescaleDB initialization script
-- Enable TimescaleDB extension for time-series data optimization

-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- This will be executed after Prisma migrations
-- After running 'prisma migrate dev', run this to convert price_data to hypertable:
-- SELECT create_hypertable('price_data', 'timestamp', if_not_exists => TRUE);

-- Create indexes for better performance
-- These will be created after the table exists via Prisma

-- Continuous aggregates for different timeframes (optional, for future optimization)
-- This allows super-fast queries for historical data
