import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePortfolioDto, OpenTradeDto } from "./dto";
import { MarketDataService } from "../market-data/market-data.service";

@Injectable()
export class PaperTradingService {
  private readonly logger = new Logger(PaperTradingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
  ) {}

  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    this.logger.log(`Creating portfolio for user ${userId}`);

    // Check if user already has a portfolio
    const existing = await this.prisma.paperPortfolio.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.paperPortfolio.create({
      data: {
        userId,
        initialBalance: dto.initialBalance,
        currentBalance: dto.initialBalance,
        totalPnl: 0,
        totalPnlPercent: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        maxDrawdown: 0,
      },
    });
  }

  async getPortfolio(userId: string) {
    const portfolio = await this.prisma.paperPortfolio.findUnique({
      where: { userId },
    });

    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    return portfolio;
  }

  async getPortfolioStats(userId: string) {
    const portfolio = await this.getPortfolio(userId);
    const openTrades = await this.getOpenTrades(userId);

    // Calculate unrealized P&L
    let unrealizedPnl = 0;
    for (const trade of openTrades) {
      const ticker = await this.marketDataService.get24hrTicker(trade.symbol);
      const currentPrice = parseFloat(ticker.lastPrice);
      const pnl =
        trade.side === "BUY"
          ? (currentPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - currentPrice) * trade.quantity;
      unrealizedPnl += pnl;
    }

    const totalEquity = portfolio.currentBalance + unrealizedPnl;

    return {
      ...portfolio,
      totalEquity,
      openPositions: openTrades.length,
      unrealizedPnl,
      dailyPnl: 0, // TODO: Calculate from trades
      weeklyPnl: 0,
      monthlyPnl: 0,
    };
  }

  async resetPortfolio(userId: string) {
    this.logger.log(`Resetting portfolio for user ${userId}`);

    const portfolio = await this.getPortfolio(userId);

    // Close all open trades
    await this.prisma.paperTrade.updateMany({
      where: {
        portfolioId: portfolio.id,
        status: "OPEN",
      },
      data: {
        status: "CLOSED",
        closeReason: "RESET",
        closedAt: new Date(),
      },
    });

    // Reset portfolio
    return this.prisma.paperPortfolio.update({
      where: { id: portfolio.id },
      data: {
        currentBalance: portfolio.initialBalance,
        totalPnl: 0,
        totalPnlPercent: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        maxDrawdown: 0,
      },
    });
  }

  async openTrade(userId: string, dto: OpenTradeDto) {
    this.logger.log(`Opening trade for user ${userId}: ${dto.symbol}`);

    const portfolio = await this.getPortfolio(userId);

    // Get current price
    const ticker = await this.marketDataService.get24hrTicker(dto.symbol);
    const currentPrice = parseFloat(ticker.lastPrice);

    // Calculate cost
    const cost = currentPrice * dto.quantity;

    if (cost > portfolio.currentBalance) {
      throw new Error("Insufficient balance");
    }

    // Create trade
    const trade = await this.prisma.paperTrade.create({
      data: {
        portfolioId: portfolio.id,
        symbol: dto.symbol,
        side: dto.side,
        type: dto.type,
        quantity: dto.quantity,
        entryPrice: currentPrice,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit,
        status: "OPEN",
      },
    });

    // Update portfolio balance
    await this.prisma.paperPortfolio.update({
      where: { id: portfolio.id },
      data: {
        currentBalance: portfolio.currentBalance - cost,
      },
    });

    return trade;
  }

  async closeTrade(userId: string, tradeId: string) {
    this.logger.log(`Closing trade ${tradeId} for user ${userId}`);

    const portfolio = await this.getPortfolio(userId);

    const trade = await this.prisma.paperTrade.findFirst({
      where: {
        id: tradeId,
        portfolioId: portfolio.id,
        status: "OPEN",
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade not found");
    }

    // Get current price
    const ticker = await this.marketDataService.get24hrTicker(trade.symbol);
    const exitPrice = parseFloat(ticker.lastPrice);

    // Calculate P&L
    const pnl =
      trade.side === "BUY"
        ? (exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - exitPrice) * trade.quantity;

    const pnlPercent = (pnl / (trade.entryPrice * trade.quantity)) * 100;

    // Update trade
    await this.prisma.paperTrade.update({
      where: { id: trade.id },
      data: {
        exitPrice,
        pnl,
        pnlPercent,
        status: "CLOSED",
        closeReason: "MANUAL",
        closedAt: new Date(),
      },
    });

    // Return capital and P&L to portfolio
    const newBalance =
      portfolio.currentBalance + trade.entryPrice * trade.quantity + pnl;

    // Update portfolio stats
    const isWinning = pnl > 0;
    await this.prisma.paperPortfolio.update({
      where: { id: portfolio.id },
      data: {
        currentBalance: newBalance,
        totalPnl: portfolio.totalPnl + pnl,
        totalPnlPercent:
          ((portfolio.initialBalance +
            portfolio.totalPnl +
            pnl -
            portfolio.initialBalance) /
            portfolio.initialBalance) *
          100,
        totalTrades: portfolio.totalTrades + 1,
        winningTrades: isWinning
          ? portfolio.winningTrades + 1
          : portfolio.winningTrades,
        losingTrades: !isWinning
          ? portfolio.losingTrades + 1
          : portfolio.losingTrades,
        winRate:
          ((isWinning ? portfolio.winningTrades + 1 : portfolio.winningTrades) /
            (portfolio.totalTrades + 1)) *
          100,
      },
    });

    return { message: "Trade closed successfully" };
  }

  async getOpenTrades(userId: string) {
    const portfolio = await this.getPortfolio(userId);

    const trades = await this.prisma.paperTrade.findMany({
      where: {
        portfolioId: portfolio.id,
        status: "OPEN",
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    // Enrich with current prices
    const enrichedTrades = await Promise.all(
      trades.map(async (trade) => {
        try {
          const ticker = await this.marketDataService.get24hrTicker(
            trade.symbol,
          );
          const currentPrice = parseFloat(ticker.lastPrice);
          const unrealizedPnl =
            trade.side === "BUY"
              ? (currentPrice - trade.entryPrice) * trade.quantity
              : (trade.entryPrice - currentPrice) * trade.quantity;
          const unrealizedPnlPercent =
            (unrealizedPnl / (trade.entryPrice * trade.quantity)) * 100;

          return {
            ...trade,
            currentPrice,
            unrealizedPnl,
            unrealizedPnlPercent,
          };
        } catch (error) {
          return trade;
        }
      }),
    );

    return enrichedTrades;
  }

  async getTradeHistory(userId: string, limit: number = 20) {
    const portfolio = await this.getPortfolio(userId);

    const trades = await this.prisma.paperTrade.findMany({
      where: {
        portfolioId: portfolio.id,
        status: "CLOSED",
      },
      orderBy: {
        closedAt: "desc",
      },
      take: limit,
    });

    return { trades, total: trades.length };
  }
}
