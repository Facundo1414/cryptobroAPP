import { Module } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gateway";
import { RealtimePriceService } from "./realtime-price.service";
import { MarketDataModule } from "../market-data/market-data.module";
// import { AuthModule } from "../auth/auth.module"; // TODO: Add Supabase config

@Module({
  imports: [
    MarketDataModule,
    /* AuthModule */
  ], // TODO: Re-enable when auth is configured
  providers: [WebsocketGateway, RealtimePriceService],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
