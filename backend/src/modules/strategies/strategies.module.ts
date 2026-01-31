import { Module } from "@nestjs/common";
import { StrategiesService } from "./strategies.service";
import { StrategiesController } from "./strategies.controller";
import { RsiVolumeStrategy } from "./implementations/rsi-volume.strategy";
import { EmaRibbonStrategy } from "./implementations/ema-ribbon.strategy";
import { MacdRsiStrategy } from "./implementations/macd-rsi.strategy";
import { IndicatorsModule } from "../indicators/indicators.module";

@Module({
  imports: [IndicatorsModule],
  controllers: [StrategiesController],
  providers: [
    StrategiesService,
    RsiVolumeStrategy,
    EmaRibbonStrategy,
    MacdRsiStrategy,
  ],
  exports: [StrategiesService],
})
export class StrategiesModule {}
