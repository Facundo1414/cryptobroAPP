import { Injectable, Logger } from '@nestjs/common';
import { TelegramService, SignalNotification } from './telegram.service';

export type NotificationChannel = 'telegram' | 'email' | 'push';

export interface NotificationPayload {
  type: 'signal' | 'alert' | 'summary' | 'test';
  channels: NotificationChannel[];
  data: any;
  userId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly telegram: TelegramService) {}

  /**
   * Enviar notificación por los canales especificados
   */
  async send(payload: NotificationPayload): Promise<boolean> {
    const results: boolean[] = [];

    for (const channel of payload.channels) {
      switch (channel) {
        case 'telegram':
          const result = await this.sendViaTelegram(payload);
          results.push(result);
          break;

        case 'email':
          // TODO: Implementar email con Resend
          this.logger.warn('Email notifications not implemented yet');
          results.push(false);
          break;

        case 'push':
          // TODO: Implementar Web Push
          this.logger.warn('Push notifications not implemented yet');
          results.push(false);
          break;
      }
    }

    return results.some((r) => r); // Al menos uno exitoso
  }

  /**
   * Enviar notificación de señal
   */
  async sendSignalNotification(signal: SignalNotification): Promise<boolean> {
    return this.send({
      type: 'signal',
      channels: ['telegram'],
      data: signal,
    });
  }

  /**
   * Enviar alerta de precio
   */
  async sendPriceAlert(
    crypto: string,
    currentPrice: number,
    targetPrice: number,
    condition: 'ABOVE' | 'BELOW',
  ): Promise<boolean> {
    return this.telegram.sendPriceAlert(crypto, currentPrice, targetPrice, condition);
  }

  /**
   * Enviar resumen diario
   */
  async sendDailySummary(signals: { buy: number; sell: number; hold: number }): Promise<boolean> {
    return this.telegram.sendDailySummary(signals);
  }

  /**
   * Test de conexión
   */
  async testNotifications(): Promise<{ telegram: boolean; email: boolean; push: boolean }> {
    const telegramResult = await this.telegram.testConnection();
    
    return {
      telegram: telegramResult,
      email: false, // Not implemented
      push: false, // Not implemented
    };
  }

  private async sendViaTelegram(payload: NotificationPayload): Promise<boolean> {
    switch (payload.type) {
      case 'signal':
        return this.telegram.sendSignalNotification(payload.data);

      case 'alert':
        return this.telegram.sendPriceAlert(
          payload.data.crypto,
          payload.data.currentPrice,
          payload.data.targetPrice,
          payload.data.condition,
        );

      case 'summary':
        return this.telegram.sendDailySummary(payload.data);

      case 'test':
        return this.telegram.testConnection();

      default:
        this.logger.warn(`Unknown notification type: ${payload.type}`);
        return false;
    }
  }
}
