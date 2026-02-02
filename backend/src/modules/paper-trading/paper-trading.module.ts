import { Module } from "@nestjs/common";
import { PaperTradingController } from "./paper-trading.controller";
import { PaperTradingService } from "./paper-trading.service";
import { AuthModule } from "../auth/auth.module";
import { MarketDataModule } from "../market-data/market-data.module";

@Module({
  imports: [AuthModule, MarketDataModule],
  controllers: [PaperTradingController],
  providers: [PaperTradingService],
  exports: [PaperTradingService],
})
export class PaperTradingModule {}
