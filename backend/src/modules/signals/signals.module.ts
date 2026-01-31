import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { SignalsService } from "./signals.service";
import { SignalsController } from "./signals.controller";
import { SignalGeneratorService } from "./signal-generator.service";
import { SignalGenerationProcessor } from "./signal-generation.processor";
import { SignalGenerationCron } from "./signal-generation.cron";
import { StrategiesModule } from "../strategies/strategies.module";
import { WebsocketModule } from "../websocket/websocket.module";
import { NotificationModule } from "../notifications/notification.module";

@Module({
  imports: [
    StrategiesModule,
    WebsocketModule,
    NotificationModule,
    // BullModule.registerQueue({
    //   name: "signal-generation",
    // }),
  ],
  controllers: [SignalsController],
  providers: [
    SignalsService,
    SignalGeneratorService,
    // SignalGenerationProcessor,  // Requiere Bull Queue
    // SignalGenerationCron,  // Requiere Bull Queue
  ],
  exports: [SignalsService, SignalGeneratorService],
})
export class SignalsModule {}
