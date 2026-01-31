import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed cryptocurrencies
  const cryptos = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      binanceSymbol: "BTCUSDT",
      imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
      isActive: true,
      isPopular: true,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      binanceSymbol: "ETHUSDT",
      imageUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
      isActive: true,
      isPopular: true,
    },
    {
      name: "Solana",
      symbol: "SOL",
      binanceSymbol: "SOLUSDT",
      imageUrl: "https://cryptologos.cc/logos/solana-sol-logo.png",
      isActive: true,
      isPopular: true,
    },
    {
      name: "Binance Coin",
      symbol: "BNB",
      binanceSymbol: "BNBUSDT",
      imageUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
      isActive: true,
      isPopular: true,
    },
    {
      name: "Cardano",
      symbol: "ADA",
      binanceSymbol: "ADAUSDT",
      imageUrl: "https://cryptologos.cc/logos/cardano-ada-logo.png",
      isActive: true,
    },
    {
      name: "XRP",
      symbol: "XRP",
      binanceSymbol: "XRPUSDT",
      imageUrl: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
      isActive: true,
    },
    {
      name: "Polkadot",
      symbol: "DOT",
      binanceSymbol: "DOTUSDT",
      imageUrl: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
      isActive: true,
    },
    {
      name: "Avalanche",
      symbol: "AVAX",
      binanceSymbol: "AVAXUSDT",
      imageUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
      isActive: true,
    },
    {
      name: "Dogecoin",
      symbol: "DOGE",
      binanceSymbol: "DOGEUSDT",
      imageUrl: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
      isActive: true,
      isPopular: true,
    },
    {
      name: "Polygon",
      symbol: "MATIC",
      binanceSymbol: "MATICUSDT",
      imageUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png",
      isActive: true,
    },
    {
      name: "Litecoin",
      symbol: "LTC",
      binanceSymbol: "LTCUSDT",
      imageUrl: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
      isActive: true,
    },
  ];

  console.log("📊 Creating cryptocurrencies...");
  for (const crypto of cryptos) {
    await prisma.cryptocurrency.upsert({
      where: { symbol: crypto.symbol },
      update: {
        name: crypto.name,
        imageUrl: crypto.imageUrl,
        isActive: crypto.isActive,
        isPopular: crypto.isPopular ?? false,
      },
      create: crypto,
    });
    console.log(`  ✅ ${crypto.symbol} - ${crypto.name}`);
  }

  console.log("\n✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
