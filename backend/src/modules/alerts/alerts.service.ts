import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CreateAlertDto, UpdateAlertDto } from "./dto/alert.dto";
import { Alert, AlertStatus } from "@prisma/client";

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new alert
   */
  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    this.logger.log(`Creating alert for user ${createAlertDto.userId}`);

    return this.prisma.alert.create({
      data: {
        userId: createAlertDto.userId,
        cryptoId: createAlertDto.cryptoId,
        title:
          createAlertDto.message ||
          `Price Alert for ${createAlertDto.targetPrice}`,
        condition: createAlertDto.condition,
        targetPrice: createAlertDto.targetPrice,
        message:
          createAlertDto.message ||
          `Price Alert for ${createAlertDto.targetPrice}`,
        status: AlertStatus.ACTIVE,
        notifyEmail: createAlertDto.notifyEmail ?? true,
        notifyPush: createAlertDto.notifyPush ?? false,
      },
      include: {
        crypto: true,
        user: true,
      },
    });
  }

  /**
   * Get all alerts for a user
   */
  async findAll(userId: string, status?: AlertStatus): Promise<Alert[]> {
    const where: any = { userId };
    if (status) where.status = status;

    return this.prisma.alert.findMany({
      where,
      include: {
        crypto: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get a single alert
   */
  async findOne(id: string): Promise<Alert> {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        crypto: true,
        user: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  /**
   * Update an alert
   */
  async update(id: string, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    await this.findOne(id);

    return this.prisma.alert.update({
      where: { id },
      data: updateAlertDto,
      include: {
        crypto: true,
        user: true,
      },
    });
  }

  /**
   * Delete an alert
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.alert.delete({ where: { id } });
    this.logger.log(`Deleted alert: ${id}`);
  }

  /**
   * Check alerts and trigger notifications (scheduled task)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlerts(): Promise<void> {
    try {
      const activeAlerts = await this.prisma.alert.findMany({
        where: { status: AlertStatus.ACTIVE },
        include: {
          crypto: true,
          user: true,
        },
      });

      if (activeAlerts.length === 0) {
        return;
      }

      this.logger.debug(`Checking ${activeAlerts.length} active alerts...`);

      for (const alert of activeAlerts) {
        try {
          await this.checkAlert(alert);
        } catch (error) {
          this.logger.error(`Error checking alert ${alert.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error("Error in checkAlerts cron job", error);
    }
  }

  /**
   * Check a single alert
   */
  private async checkAlert(
    alert: Alert & { crypto: any; user: any },
  ): Promise<void> {
    // Get latest price for this crypto
    if (!alert.cryptoId) {
      this.logger.warn(
        `Alert ${alert.id} has no cryptoId, skipping price check`,
      );
      return;
    }

    const latestPrice = await this.prisma.priceData.findFirst({
      where: {
        cryptoId: alert.cryptoId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (!latestPrice) {
      return;
    }

    const currentPrice = latestPrice.close;
    let shouldTrigger = false;

    // Check condition
    if (!alert.targetPrice) {
      this.logger.warn(`Alert ${alert.id} has no targetPrice, skipping`);
      return;
    }

    if (alert.condition === "ABOVE" && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (
      alert.condition === "BELOW" &&
      currentPrice <= alert.targetPrice
    ) {
      shouldTrigger = true;
    } else if (!alert.condition) {
      // Simple price alert (both directions)
      const priceDiff = Math.abs(currentPrice - alert.targetPrice);
      const threshold = alert.targetPrice * 0.002; // 0.2% threshold
      if (priceDiff <= threshold) {
        shouldTrigger = true;
      }
    }

    if (shouldTrigger) {
      await this.triggerAlert(alert, currentPrice);
    }
  }

  /**
   * Trigger an alert notification
   */
  private async triggerAlert(
    alert: Alert & { crypto: any; user: any },
    currentPrice: number,
  ): Promise<void> {
    this.logger.log(
      `🔔 Alert triggered! ${alert.crypto.symbol} reached ${currentPrice} (target: ${alert.targetPrice})`,
    );

    // Update alert status
    await this.prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: AlertStatus.TRIGGERED,
        triggeredAt: new Date(),
      },
    });

    // Send notifications
    if (alert.notifyEmail) {
      await this.sendEmailNotification(alert, currentPrice);
    }

    if (alert.notifyPush) {
      await this.sendPushNotification(alert, currentPrice);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    alert: Alert & { crypto: any; user: any },
    currentPrice: number,
  ): Promise<void> {
    // TODO: Implement email sending (e.g., using SendGrid, AWS SES)
    this.logger.log(
      `📧 Email notification sent to ${alert.user.email}: ${alert.crypto.symbol} @ ${currentPrice}`,
    );
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    alert: Alert & { crypto: any; user: any },
    currentPrice: number,
  ): Promise<void> {
    // TODO: Implement push notifications (e.g., using Firebase Cloud Messaging)
    this.logger.log(
      `📱 Push notification sent to user ${alert.userId}: ${alert.crypto.symbol} @ ${currentPrice}`,
    );
  }

  /**
   * Create alert from signal
   */
  async createAlertFromSignal(
    userId: string,
    signalId: string,
  ): Promise<Alert> {
    const signal = await this.prisma.signal.findUnique({
      where: { id: signalId },
      include: { crypto: true, strategy: true },
    });

    if (!signal) {
      throw new NotFoundException(`Signal with ID ${signalId} not found`);
    }

    const message = `${signal.type} signal for ${signal.crypto.symbol} at ${signal.price}. Strategy: ${signal.strategy.name}`;

    return this.create({
      userId,
      cryptoId: signal.cryptoId,
      condition: signal.type,
      targetPrice:
        signal.type === "BUY"
          ? signal.suggestedTP || signal.price
          : signal.suggestedSL || signal.price,
      message,
      notifyEmail: true,
      notifyPush: true,
    });
  }

  /**
   * Get alert statistics
   */
  async getStatistics(userId: string): Promise<any> {
    const [total, active, triggered, cancelled] = await Promise.all([
      this.prisma.alert.count({ where: { userId } }),
      this.prisma.alert.count({
        where: { userId, status: AlertStatus.ACTIVE },
      }),
      this.prisma.alert.count({
        where: { userId, status: AlertStatus.TRIGGERED },
      }),
      this.prisma.alert.count({
        where: { userId, status: AlertStatus.CANCELLED },
      }),
    ]);

    return {
      total,
      active,
      triggered,
      cancelled,
    };
  }
}
