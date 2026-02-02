import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bull";
import { ThrottlerModule } from "@nestjs/throttler";

// Common modules
import { PrismaModule } from "./prisma/prisma.module";

// Feature modules
import { AuthModule } from "./modules/auth/auth.module";
import { CryptoModule } from "./modules/crypto/crypto.module";
import { StrategiesModule } from "./modules/strategies/strategies.module";
import { SignalsModule } from "./modules/signals/signals.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { BacktestingModule } from "./modules/backtesting/backtesting.module";
import { MarketDataModule } from "./modules/market-data/market-data.module";
import { NewsModule } from "./modules/news/news.module";
import { IndicatorsModule } from "./modules/indicators/indicators.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";
import { WatchlistModule } from "./modules/watchlist/watchlist.module";
import { NotificationModule } from "./modules/notifications/notification.module";

// Sprint 5-6: Trading modules
import { PaperTradingModule } from "./modules/paper-trading/paper-trading.module";
import { DCABotModule } from "./modules/dca-bot/dca-bot.module";
// import { GridBotModule } from "./modules/grid-bot/grid-bot.module";

// Sprint 7: Telegram Bot (temporalmente deshabilitado)
// import { TelegramModule } from "./modules/telegram/telegram.module";

// Sprint 8: Risk Management
import { RiskManagementModule } from "./modules/risk-management/risk-management.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Scheduling (for cron jobs)
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Bull Queue - Comentado temporalmente (requiere Redis/Docker)
    // BullModule.forRoot({
    //   redis: {
    //     host: process.env.BULL_REDIS_HOST || "localhost",
    //     port: parseInt(process.env.BULL_REDIS_PORT || "6379"),
    //   },
    // }),

    // Common modules
    PrismaModule,

    // Feature modules
    AuthModule,
    CryptoModule,
    StrategiesModule,
    SignalsModule,
    AlertsModule,
    BacktestingModule,
    MarketDataModule,
    NewsModule,
    IndicatorsModule,
    WebsocketModule,
    WatchlistModule,
    NotificationModule,

    // Sprint 5-6: Trading bots
    PaperTradingModule,
    DCABotModule,
    // GridBotModule,

    // Sprint 7: Telegram (temporalmente deshabilitado)
    // TelegramModule,

    // Sprint 8: Risk Management
    RiskManagementModule,
  ],
})
export class AppModule {}
