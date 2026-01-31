import { Module } from "@nestjs/common";
import { BacktestingController } from "./backtesting.controller";
import { BacktestingService } from "./backtesting.service";
import { AuthModule } from "../auth/auth.module";
import { StrategiesModule } from "../strategies/strategies.module";
import { IndicatorsModule } from "../indicators/indicators.module";

@Module({
  imports: [AuthModule, StrategiesModule, IndicatorsModule],
  controllers: [BacktestingController],
  providers: [BacktestingService],
  exports: [BacktestingService],
})
export class BacktestingModule {}
