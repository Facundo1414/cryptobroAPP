import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed System Strategies
 *
 * Creates the built-in trading strategies in the database
 * These strategies are used by the automatic signal generation system
 *
 * Note: Strategies require a userId. We create a system user for this purpose.
 */
async function seedStrategies() {
  console.log("🌱 Seeding system strategies...");

  try {
    // Create or get system user
    let systemUser = await prisma.user.findUnique({
      where: { email: "system@cryptoanalyzer.internal" },
    });

    if (!systemUser) {
      console.log("Creating system user...");
      systemUser = await prisma.user.create({
        data: {
          id: "system-user-000000000000",
          email: "system@cryptoanalyzer.internal",
          name: "System",
          role: "admin",
          preferences: {
            isSystemUser: true,
          },
        },
      });
      console.log("✅ System user created");
    }

    // Define strategies
    const strategies = [
      {
        name: "RSI_VOLUME",
        description: "RSI with Volume Confirmation - Win Rate: 68-72%",
        type: "RSI_VOLUME" as const,
        config: {
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          volumeMultiplier: 1.5,
          useEmaFilter: true,
          emaPeriod: 20,
        },
        timeframes: ["5m", "15m", "1h", "4h"],
      },
      {
        name: "EMA_RIBBON",
        description: "EMA Ribbon Strategy - Win Rate: 65-70%",
        type: "EMA_RIBBON" as const,
        config: {
          shortEma: 9,
          mediumEma: 21,
          longEma: 55,
          ema100: 100,
          ema200: 200,
          useTrendFilter: true,
        },
        timeframes: ["15m", "1h", "4h", "1d"],
      },
      {
        name: "MACD_RSI",
        description: "MACD + RSI Confluence - Win Rate: 63-68%",
        type: "MACD_RSI_CONFLUENCE" as const,
        config: {
          macdFast: 12,
          macdSlow: 26,
          macdSignal: 9,
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          requireConfluence: true,
        },
        timeframes: ["1h", "4h", "1d"],
      },
    ];

    // Create strategies
    for (const strategyData of strategies) {
      const existing = await prisma.strategy.findFirst({
        where: {
          name: strategyData.name,
          userId: systemUser.id,
        },
      });

      if (existing) {
        console.log(
          `Strategy ${strategyData.name} already exists, updating...`,
        );
        await prisma.strategy.update({
          where: { id: existing.id },
          data: {
            description: strategyData.description,
            type: strategyData.type,
            config: strategyData.config,
            timeframes: strategyData.timeframes,
            isActive: true,
          },
        });
      } else {
        console.log(`Creating strategy: ${strategyData.name}`);
        await prisma.strategy.create({
          data: {
            userId: systemUser.id,
            name: strategyData.name,
            description: strategyData.description,
            type: strategyData.type,
            config: strategyData.config,
            timeframes: strategyData.timeframes,
            isActive: true,
          },
        });
      }

      console.log(`✅ ${strategyData.name}`);
    }

    console.log("\n✅ System strategies seeded successfully!");
    console.log("\nCreated strategies:");
    strategies.forEach((s) => {
      console.log(`  - ${s.name}: ${s.description}`);
    });
  } catch (error) {
    console.error("❌ Error seeding strategies:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedStrategies()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
