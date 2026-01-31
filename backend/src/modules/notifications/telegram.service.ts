import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
}

export interface SignalNotification {
  type: 'BUY' | 'SELL';
  cryptoSymbol: string;
  price: number;
  confidence: number;
  strategy: string;
  stopLoss?: number;
  takeProfit?: number;
  reasoning?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;
  private readonly defaultChatId: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.defaultChatId = this.config.get<string>('TELEGRAM_CHAT_ID') || '';

    if (this.botToken) {
      this.logger.log('✅ Telegram Service initialized');
    } else {
      this.logger.warn('⚠️ Telegram bot token not configured');
    }
  }

  /**
   * Verificar si el bot está configurado
   */
  isConfigured(): boolean {
    return !!this.botToken && !!this.defaultChatId;
  }

  /**
   * Enviar mensaje de texto simple
   */
  async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('Telegram bot not configured, skipping notification');
      return false;
    }

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: message.chatId || this.defaultChatId,
        text: message.text,
        parse_mode: message.parseMode || 'HTML',
        disable_web_page_preview: message.disableWebPagePreview ?? true,
      });

      if (response.data.ok) {
        this.logger.log(`✅ Telegram message sent to ${message.chatId || this.defaultChatId}`);
        return true;
      } else {
        this.logger.error('Telegram API error:', response.data);
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to send Telegram message:', error.message);
      return false;
    }
  }

  /**
   * Enviar notificación de señal de trading
   */
  async sendSignalNotification(
    signal: SignalNotification,
    chatId?: string,
  ): Promise<boolean> {
    const emoji = signal.type === 'BUY' ? '🟢' : '🔴';
    const actionEmoji = signal.type === 'BUY' ? '📈' : '📉';

    const message = `
${emoji} <b>SEÑAL DE ${signal.type}</b> ${emoji}

${actionEmoji} <b>Crypto:</b> ${signal.cryptoSymbol}
💵 <b>Precio:</b> $${signal.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📊 <b>Estrategia:</b> ${signal.strategy}
🎯 <b>Confianza:</b> ${signal.confidence}%

${signal.stopLoss ? `🛑 <b>Stop Loss:</b> $${signal.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
${signal.takeProfit ? `✅ <b>Take Profit:</b> $${signal.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}

${signal.reasoning ? `\n💡 <b>Razón:</b> ${signal.reasoning}` : ''}

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}

<i>⚠️ Esto no es consejo financiero. Opera bajo tu propio riesgo.</i>
    `.trim();

    return this.sendMessage({
      chatId: chatId || this.defaultChatId,
      text: message,
      parseMode: 'HTML',
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
    chatId?: string,
  ): Promise<boolean> {
    const emoji = condition === 'ABOVE' ? '⬆️' : '⬇️';

    const message = `
🔔 <b>ALERTA DE PRECIO</b> 🔔

${emoji} ${crypto} ha ${condition === 'ABOVE' ? 'superado' : 'caído por debajo de'} tu precio objetivo!

💵 <b>Precio actual:</b> $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
🎯 <b>Precio objetivo:</b> $${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}
    `.trim();

    return this.sendMessage({
      chatId: chatId || this.defaultChatId,
      text: message,
      parseMode: 'HTML',
    });
  }

  /**
   * Enviar resumen diario
   */
  async sendDailySummary(
    signals: { buy: number; sell: number; hold: number },
    topSignal?: SignalNotification,
    chatId?: string,
  ): Promise<boolean> {
    const total = signals.buy + signals.sell + signals.hold;

    let message = `
📊 <b>RESUMEN DIARIO</b> 📊

📈 Señales de compra: ${signals.buy}
📉 Señales de venta: ${signals.sell}
⏸️ Señales de espera: ${signals.hold}
━━━━━━━━━━━━━━━━━━
📋 Total: ${total} señales
    `.trim();

    if (topSignal) {
      message += `

🏆 <b>Mejor señal del día:</b>
${topSignal.type === 'BUY' ? '🟢' : '🔴'} ${topSignal.cryptoSymbol} - ${topSignal.confidence}% confianza`;
    }

    message += `

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}`;

    return this.sendMessage({
      chatId: chatId || this.defaultChatId,
      text: message,
      parseMode: 'HTML',
    });
  }

  /**
   * Test de conexión
   */
  async testConnection(chatId?: string): Promise<boolean> {
    const message = `
✅ <b>CryptoBro conectado!</b>

Tu bot de notificaciones está funcionando correctamente.
Recibirás alertas de señales de trading aquí.

⏰ ${new Date().toLocaleString('es-AR', { timeZone: 'America/Buenos_Aires' })}
    `.trim();

    return this.sendMessage({
      chatId: chatId || this.defaultChatId,
      text: message,
      parseMode: 'HTML',
    });
  }

  /**
   * Obtener información del bot
   */
  async getBotInfo(): Promise<any> {
    if (!this.botToken) {
      return null;
    }

    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      this.logger.error('Failed to get bot info:', error.message);
      return null;
    }
  }
}
