import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { TelegramService } from './telegram.service';

class TestNotificationDto {
  chatId?: string;
}

class SendSignalDto {
  type: 'BUY' | 'SELL';
  cryptoSymbol: string;
  price: number;
  confidence: number;
  strategy: string;
  stopLoss?: number;
  takeProfit?: number;
  reasoning?: string;
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test notification channels' })
  @ApiResponse({ status: 200, description: 'Test results for each channel' })
  async testNotifications(@Body() dto: TestNotificationDto) {
    const results = await this.notificationService.testNotifications();
    return {
      success: results.telegram || results.email || results.push,
      results,
      message: results.telegram
        ? 'Telegram notification sent successfully!'
        : 'No notification channels available. Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.',
    };
  }

  @Post('telegram/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test Telegram connection' })
  async testTelegram(@Body() dto: TestNotificationDto) {
    const success = await this.telegramService.testConnection(dto.chatId);
    return {
      success,
      message: success
        ? 'Telegram notification sent!'
        : 'Failed to send. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.',
    };
  }

  @Post('signal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send signal notification' })
  async sendSignalNotification(@Body() dto: SendSignalDto) {
    const success = await this.notificationService.sendSignalNotification(dto);
    return {
      success,
      message: success ? 'Signal notification sent!' : 'Failed to send notification.',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get notification service status' })
  async getStatus() {
    const telegramConfigured = this.telegramService.isConfigured();
    const botInfo = telegramConfigured ? await this.telegramService.getBotInfo() : null;

    return {
      telegram: {
        configured: telegramConfigured,
        botInfo: botInfo
          ? {
              username: botInfo.username,
              firstName: botInfo.first_name,
            }
          : null,
      },
      email: {
        configured: false,
      },
      push: {
        configured: false,
      },
    };
  }
}
