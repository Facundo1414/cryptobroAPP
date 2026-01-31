import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { CreateCryptoDto } from "./dto/create-crypto.dto";
import { UpdateCryptoDto } from "./dto/update-crypto.dto";
import { Cryptocurrency } from "@prisma/client";

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new cryptocurrency
   */
  async create(createCryptoDto: CreateCryptoDto): Promise<Cryptocurrency> {
    this.logger.log(`Creating cryptocurrency: ${createCryptoDto.symbol}`);

    return this.prisma.cryptocurrency.create({
      data: {
        name: createCryptoDto.name,
        symbol: createCryptoDto.symbol,
        binanceSymbol: createCryptoDto.binanceSymbol,
        imageUrl: createCryptoDto.logoUrl,
        isActive: createCryptoDto.isActive ?? true,
      },
    });
  }

  /**
   * Get all cryptocurrencies
   */
  async findAll(includeInactive: boolean = false): Promise<Cryptocurrency[]> {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.cryptocurrency.findMany({
      where,
      orderBy: {
        symbol: "asc",
      },
    });
  }

  /**
   * Get a single cryptocurrency by ID
   */
  async findOne(id: string): Promise<Cryptocurrency> {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            priceData: true,
            signals: true,
            alerts: true,
          },
        },
      },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency with ID ${id} not found`);
    }

    return crypto;
  }

  /**
   * Get cryptocurrency by symbol
   */
  async findBySymbol(symbol: string): Promise<Cryptocurrency> {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${symbol} not found`);
    }

    return crypto;
  }

  /**
   * Get cryptocurrency by Binance symbol
   */
  async findByBinanceSymbol(binanceSymbol: string): Promise<Cryptocurrency> {
    const crypto = await this.prisma.cryptocurrency.findUnique({
      where: { binanceSymbol: binanceSymbol.toUpperCase() },
    });

    if (!crypto) {
      throw new NotFoundException(`Cryptocurrency ${binanceSymbol} not found`);
    }

    return crypto;
  }

  /**
   * Update a cryptocurrency
   */
  async update(
    id: string,
    updateCryptoDto: UpdateCryptoDto,
  ): Promise<Cryptocurrency> {
    this.logger.log(`Updating cryptocurrency: ${id}`);

    // Check if exists
    await this.findOne(id);

    return this.prisma.cryptocurrency.update({
      where: { id },
      data: updateCryptoDto,
    });
  }

  /**
   * Delete a cryptocurrency
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting cryptocurrency: ${id}`);

    // Check if exists
    await this.findOne(id);

    await this.prisma.cryptocurrency.delete({
      where: { id },
    });
  }

  /**
   * Seed initial cryptocurrencies
   */
  async seed(): Promise<void> {
    this.logger.log("🌱 Seeding cryptocurrencies...");

    const cryptos = [
      {
        name: "Bitcoin",
        symbol: "BTC",
        binanceSymbol: "BTCUSDT",
        description: "The first and largest cryptocurrency",
        logoUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
      },
      {
        name: "Ethereum",
        symbol: "ETH",
        binanceSymbol: "ETHUSDT",
        description: "Decentralized platform for smart contracts",
        logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
      },
      {
        name: "Solana",
        symbol: "SOL",
        binanceSymbol: "SOLUSDT",
        description: "High-performance blockchain",
        logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.png",
      },
      {
        name: "Binance Coin",
        symbol: "BNB",
        binanceSymbol: "BNBUSDT",
        description: "Native token of Binance exchange",
        logoUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
      },
      {
        name: "Cardano",
        symbol: "ADA",
        binanceSymbol: "ADAUSDT",
        description: "Proof-of-stake blockchain platform",
        logoUrl: "https://cryptologos.cc/logos/cardano-ada-logo.png",
      },
    ];

    for (const crypto of cryptos) {
      await this.prisma.cryptocurrency.upsert({
        where: { symbol: crypto.symbol },
        update: {},
        create: crypto,
      });
    }

    this.logger.log(`✅ Seeded ${cryptos.length} cryptocurrencies`);
  }
}
