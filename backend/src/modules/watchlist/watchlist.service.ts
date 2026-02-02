import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AddToWatchlistDto, UpdateWatchlistDto } from "./dto/watchlist.dto";

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's watchlist
   */
  async getWatchlist(userId: string) {
    this.logger.log(`Getting watchlist for user ${userId}`);

    const items = await this.prisma.watchlistItem.findMany({
      where: { userId },
      include: {
        crypto: true,
      },
      orderBy: {
        addedAt: "desc",
      },
    });

    return items;
  }

  /**
   * Add crypto to watchlist
   */
  async addToWatchlist(userId: string, dto: AddToWatchlistDto) {
    this.logger.log(
      `Adding ${dto.cryptoSymbol} to watchlist for user ${userId}`,
    );

    // Find crypto by symbol or binanceSymbol (in case user sends BTCUSDT instead of BTC)
    let crypto = await this.prisma.cryptocurrency.findUnique({
      where: { symbol: dto.cryptoSymbol },
    });

    // If not found, try to find by binanceSymbol
    if (!crypto) {
      crypto = await this.prisma.cryptocurrency.findUnique({
        where: { binanceSymbol: dto.cryptoSymbol },
      });
    }

    if (!crypto) {
      throw new NotFoundException(
        `Cryptocurrency ${dto.cryptoSymbol} not found`,
      );
    }

    // Check if already in watchlist
    const existing = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_cryptoId: {
          userId,
          cryptoId: crypto.id,
        },
      },
    });

    if (existing) {
      // Update existing item
      return this.prisma.watchlistItem.update({
        where: { id: existing.id },
        data: {
          notes: dto.notes,
          alertOnBuy: dto.alertOnBuy ?? true,
          alertOnSell: dto.alertOnSell ?? true,
        },
        include: {
          crypto: true,
        },
      });
    }

    // Create new item
    return this.prisma.watchlistItem.create({
      data: {
        userId,
        cryptoId: crypto.id,
        notes: dto.notes,
        alertOnBuy: dto.alertOnBuy ?? true,
        alertOnSell: dto.alertOnSell ?? true,
      },
      include: {
        crypto: true,
      },
    });
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(userId: string, cryptoSymbol: string) {
    this.logger.log(
      `Removing ${cryptoSymbol} from watchlist for user ${userId}`,
    );

    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { symbol: cryptoSymbol },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${cryptoSymbol} not found`);
    }

    const item = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_cryptoId: {
          userId,
          cryptoId: crypto.id,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`${cryptoSymbol} is not in your watchlist`);
    }

    await this.prisma.watchlistItem.delete({
      where: { id: item.id },
    });

    return { message: `${cryptoSymbol} removed from watchlist` };
  }

  /**
   * Update watchlist item
   */
  async updateWatchlistItem(
    userId: string,
    cryptoSymbol: string,
    dto: UpdateWatchlistDto,
  ) {
    this.logger.log(
      `Updating watchlist item ${cryptoSymbol} for user ${userId}`,
    );

    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { symbol: cryptoSymbol },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${cryptoSymbol} not found`);
    }

    const item = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_cryptoId: {
          userId,
          cryptoId: crypto.id,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`${cryptoSymbol} is not in your watchlist`);
    }

    return this.prisma.watchlistItem.update({
      where: { id: item.id },
      data: dto,
      include: {
        crypto: true,
      },
    });
  }

  /**
   * Check if crypto is in watchlist
   */
  async isInWatchlist(userId: string, cryptoSymbol: string): Promise<boolean> {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { symbol: cryptoSymbol },
    });

    if (!crypto) {
      return false;
    }

    const item = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_cryptoId: {
          userId,
          cryptoId: crypto.id,
        },
      },
    });

    return !!item;
  }
}
