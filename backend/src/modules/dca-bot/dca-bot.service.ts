import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDCABotDto, PreviewDCABotDto } from "./dto";
import { MarketDataService } from "../market-data/market-data.service";

@Injectable()
export class DCABotService {
  private readonly logger = new Logger(DCABotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
  ) {}

  async createBot(userId: string, dto: CreateDCABotDto) {
    this.logger.log(`Creating DCA bot for user ${userId}`);

    return this.prisma.dCABot.create({
      data: {
        userId,
        name: dto.name,
        symbol: dto.symbol,
        baseOrderSize: dto.baseOrderSize,
        safetyOrderSize: dto.safetyOrderSize,
        maxSafetyOrders: dto.maxSafetyOrders,
        priceDeviation: dto.priceDeviation,
        safetyOrderStep: dto.safetyOrderStep,
        takeProfitPercent: dto.takeProfitPercent,
        isActive: false,
        totalInvested: 0,
        currentQuantity: 0,
        filledSafetyOrders: 0,
        totalCycles: 0,
        totalProfit: 0,
      },
    });
  }

  async getBots(userId: string) {
    return this.prisma.dCABot.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBot(userId: string, botId: string) {
    const bot = await this.prisma.dCABot.findFirst({
      where: { id: botId, userId },
    });

    if (!bot) {
      throw new NotFoundException("Bot not found");
    }

    return bot;
  }

  async getBotStatus(userId: string, botId: string) {
    const bot = await this.getBot(userId, botId);

    if (!bot.isActive) {
      throw new Error("Bot is not active");
    }

    // Get current price
    const ticker = await this.marketDataService.getTicker(bot.symbol);
    const currentPrice = ticker.price;

    // Calculate target take profit price
    const targetTakeProfitPrice = bot.averagePrice
      ? bot.averagePrice * (1 + bot.takeProfitPercent / 100)
      : 0;

    // Calculate next safety order price
    const nextSafetyOrderPrice =
      bot.averagePrice && bot.filledSafetyOrders < bot.maxSafetyOrders
        ? bot.averagePrice *
          (1 -
            (bot.priceDeviation *
              Math.pow(bot.safetyOrderStep, bot.filledSafetyOrders)) /
              100)
        : null;

    // Calculate unrealized P&L
    const unrealizedPnl = bot.averagePrice
      ? (currentPrice - bot.averagePrice) * bot.currentQuantity
      : 0;
    const unrealizedPnlPercent = bot.averagePrice
      ? (unrealizedPnl / bot.totalInvested) * 100
      : 0;

    return {
      bot,
      currentPrice,
      targetTakeProfitPrice,
      nextSafetyOrderPrice,
      unrealizedPnl,
      unrealizedPnlPercent,
    };
  }

  async startBot(userId: string, botId: string) {
    this.logger.log(`Starting bot ${botId}`);

    const bot = await this.getBot(userId, botId);

    if (bot.isActive) {
      throw new Error("Bot is already active");
    }

    // Get current price and place base order
    const ticker = await this.marketDataService.getTicker(bot.symbol);
    const currentPrice = ticker.price;

    const quantity = bot.baseOrderSize / currentPrice;

    // Update bot
    return this.prisma.dCABot.update({
      where: { id: botId },
      data: {
        isActive: true,
        totalInvested: bot.baseOrderSize,
        averagePrice: currentPrice,
        currentQuantity: quantity,
        filledSafetyOrders: 0,
      },
    });
  }

  async stopBot(userId: string, botId: string, sellPosition: boolean) {
    this.logger.log(`Stopping bot ${botId}, sell: ${sellPosition}`);

    const bot = await this.getBot(userId, botId);

    if (sellPosition && bot.currentQuantity > 0) {
      // Get current price and calculate P&L
      const ticker = await this.marketDataService.getTicker(bot.symbol);
      const currentPrice = ticker.price;

      const profit =
        (currentPrice - bot.averagePrice!) * bot.currentQuantity -
        bot.totalInvested;

      // Update bot with profit and reset position
      return this.prisma.dCABot.update({
        where: { id: botId },
        data: {
          isActive: false,
          totalProfit: bot.totalProfit + profit,
          totalCycles: bot.totalCycles + 1,
          totalInvested: 0,
          averagePrice: null,
          currentQuantity: 0,
          filledSafetyOrders: 0,
        },
      });
    } else {
      // Just pause the bot
      return this.prisma.dCABot.update({
        where: { id: botId },
        data: { isActive: false },
      });
    }
  }

  async deleteBot(userId: string, botId: string) {
    const bot = await this.getBot(userId, botId);

    if (bot.isActive) {
      throw new Error("Cannot delete active bot. Stop it first.");
    }

    await this.prisma.dCABot.delete({
      where: { id: botId },
    });

    return { message: "Bot deleted successfully" };
  }

  async previewSetup(dto: PreviewDCABotDto) {
    const orders: Array<{
      orderNumber: number;
      type: string;
      price: number;
      deviation: number;
      value: number;
    }> = [];
    let totalInvestment = dto.baseOrderSize;

    // Base order
    orders.push({
      orderNumber: 0,
      type: "BASE",
      price: 100, // Relative price
      deviation: 0,
      value: dto.baseOrderSize,
    });

    // Safety orders
    for (let i = 1; i <= dto.maxSafetyOrders; i++) {
      const deviation =
        dto.priceDeviation * Math.pow(dto.safetyOrderStep, i - 1);
      const price = 100 * (1 - deviation / 100);
      totalInvestment += dto.safetyOrderSize;

      orders.push({
        orderNumber: i,
        type: "SAFETY",
        price,
        deviation,
        value: dto.safetyOrderSize,
      });
    }

    return {
      orders,
      totalInvestment,
      maxInvestment: totalInvestment,
      takeProfitPercent: dto.takeProfitPercent,
    };
  }
}
