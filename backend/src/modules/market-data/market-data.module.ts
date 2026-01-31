import { Module } from "@nestjs/common";
import { MarketDataService } from "./market-data.service";
import { MarketDataController } from "./market-data.controller";
import { BinanceService } from "./binance/binance.service";
import { BinanceWebsocketService } from "./binance/binance.websocket";

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, BinanceService, BinanceWebsocketService],
  exports: [MarketDataService, BinanceService, BinanceWebsocketService],
})
export class MarketDataModule {}
