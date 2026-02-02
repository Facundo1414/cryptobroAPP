import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { loadEnvironment } from "./config/env-loader";

// Load environment variables (from .env file or defaults)
loadEnvironment();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const configService = app.get(ConfigService);

  // Configure CORS for production
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:5000",
      // Add your production frontend URL here after deploying to Vercel
      // Example: 'https://crypto-analyzer-frontend.vercel.app',
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Global prefix
  const apiPrefix = configService.get("API_PREFIX") || "api/v1";
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Crypto Analyzer API")
    .setDescription("Advanced Trading Analysis Platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Authentication endpoints")
    .addTag("crypto", "Cryptocurrency data")
    .addTag("strategies", "Trading strategies")
    .addTag("signals", "Trading signals")
    .addTag("alerts", "User alerts")
    .addTag("backtesting", "Backtesting engine")
    .addTag("market", "Market data and sentiment")
    .addTag("news", "News and events")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // Health check endpoint (without global prefix)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get("/health", (req: any, res: any) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const port = configService.get("PORT") || 3000;
  await app.listen(port);

  console.log(`
  🚀 Crypto Analyzer Backend is running!
  
  📡 API: http://localhost:${port}/${apiPrefix}
  📚 Docs: http://localhost:${port}/api/docs
  🌍 Environment: ${configService.get("NODE_ENV")}
  `);
}

bootstrap();
