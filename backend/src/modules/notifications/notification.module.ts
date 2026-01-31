import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { TelegramService } from './telegram.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService, TelegramService],
  exports: [NotificationService, TelegramService],
})
export class NotificationModule {}
