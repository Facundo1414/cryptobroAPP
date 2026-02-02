import { Module } from "@nestjs/common";
import { DCABotController } from "./dca-bot.controller";
import { DCABotService } from "./dca-bot.service";
import { AuthModule } from "../auth/auth.module";
import { MarketDataModule } from "../market-data/market-data.module";

@Module({
  imports: [AuthModule, MarketDataModule],
  controllers: [DCABotController],
  providers: [DCABotService],
  exports: [DCABotService],
})
export class DCABotModule {}
