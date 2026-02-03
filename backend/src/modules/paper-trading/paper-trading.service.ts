import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
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
      const ticker = await this.marketDataService.getTicker(trade.symbol);
      const currentPrice = ticker.price;
      const pnl =
        trade.side === "BUY"
          ? (currentPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - currentPrice) * trade.quantity;
      unrealizedPnl += pnl;
    }

    const totalEquity = portfolio.currentBalance + unrealizedPnl;

    // Calculate P&L for different time periods
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get closed trades for each period
    const [dailyTrades, weeklyTrades, monthlyTrades] = await Promise.all([
      this.prisma.paperTrade.findMany({
        where: {
          portfolioId: portfolio.id,
          status: "CLOSED",
          closedAt: { gte: oneDayAgo },
        },
      }),
      this.prisma.paperTrade.findMany({
        where: {
          portfolioId: portfolio.id,
          status: "CLOSED",
          closedAt: { gte: oneWeekAgo },
        },
      }),
      this.prisma.paperTrade.findMany({
        where: {
          portfolioId: portfolio.id,
          status: "CLOSED",
          closedAt: { gte: oneMonthAgo },
        },
      }),
    ]);

    // Calculate P&L for each period
    const calculatePnl = (trades: any[]) => {
      return trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    };

    const dailyPnlAmount = calculatePnl(dailyTrades);
    const weeklyPnlAmount = calculatePnl(weeklyTrades);
    const monthlyPnlAmount = calculatePnl(monthlyTrades);

    // Calculate percentage based on initial balance
    const dailyPnl = (dailyPnlAmount / portfolio.initialBalance) * 100;
    const weeklyPnl = (weeklyPnlAmount / portfolio.initialBalance) * 100;
    const monthlyPnl = (monthlyPnlAmount / portfolio.initialBalance) * 100;

    return {
      ...portfolio,
      totalEquity,
      openPositions: openTrades.length,
      unrealizedPnl,
      dailyPnl: parseFloat(dailyPnl.toFixed(2)),
      weeklyPnl: parseFloat(weeklyPnl.toFixed(2)),
      monthlyPnl: parseFloat(monthlyPnl.toFixed(2)),
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
    const ticker = await this.marketDataService.getTicker(dto.symbol);
    const currentPrice = ticker.price;

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
        entryValue: cost,
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
    const ticker = await this.marketDataService.getTicker(trade.symbol);
    const exitPrice = ticker.price;

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

    // Calculate peak balance and drawdown
    const newPeakBalance = Math.max(portfolio.peakBalance, newBalance);
    const drawdown =
      newPeakBalance > 0
        ? ((newPeakBalance - newBalance) / newPeakBalance) * 100
        : 0;

    // Update portfolio stats
    const isWinning = pnl > 0;
    await this.prisma.paperPortfolio.update({
      where: { id: portfolio.id },
      data: {
        currentBalance: newBalance,
        peakBalance: newPeakBalance,
        maxDrawdown: Math.max(portfolio.maxDrawdown, drawdown),
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
          const ticker = await this.marketDataService.getTicker(trade.symbol);
          const currentPrice = ticker.price;
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
