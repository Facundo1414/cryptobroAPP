import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { BacktestingService } from "./backtesting.service";
import { CreateBacktestDto } from "./dto/create-backtest.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Backtesting")
@Controller("backtesting")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BacktestingController {
  constructor(private readonly backtestingService: BacktestingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create and start a new backtest",
    description:
      "Simulates a trading strategy on historical data and calculates performance metrics",
  })
  @ApiResponse({
    status: 201,
    description: "Backtest created and started successfully",
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "PENDING",
        config: {
          strategyId: "123",
          cryptoSymbol: "BTC",
          startDate: "2023-01-01T00:00:00Z",
          endDate: "2023-12-31T23:59:59Z",
          initialCapital: 10000,
          timeframe: "1h",
          tradingFee: 0.1,
          slippage: 0.05,
        },
        startedAt: "2024-01-14T10:00:00Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createBacktest(
    @CurrentUser("id") userId: string,
    @Body() createBacktestDto: CreateBacktestDto
  ) {
    return this.backtestingService.createBacktest(userId, createBacktestDto);
  }

  @Get()
  @ApiOperation({
    summary: "List user backtests",
    description: "Returns all backtests for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "Backtests retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async listBacktests(@CurrentUser("id") userId: string) {
    return this.backtestingService.listBacktests(userId);
  }

  @Get(":id")
  @ApiParam({ name: "id", description: "Backtest ID" })
  @ApiOperation({
    summary: "Get backtest by ID",
    description:
      "Returns detailed backtest results including trades, metrics, and equity curve",
  })
  @ApiResponse({
    status: 200,
    description: "Backtest retrieved successfully",
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "COMPLETED",
        config: {
          /* ... */
        },
        trades: [
          {
            id: "1",
            timestamp: "2023-01-01T10:00:00Z",
            type: "BUY",
            price: 16500,
            amount: 0.5,
            fee: 8.25,
            total: 8250,
            balance: 1750,
            reason: "RSI oversold + volume spike",
          },
        ],
        metrics: {
          totalTrades: 45,
          winRate: 68.5,
          netProfit: 2345.67,
          totalReturnPercent: 23.45,
          maxDrawdownPercent: 8.5,
          sharpeRatio: 1.85,
        },
        equityCurve: [
          /* ... */
        ],
        drawdownCurve: [
          /* ... */
        ],
        startedAt: "2024-01-14T10:00:00Z",
        completedAt: "2024-01-14T10:05:23Z",
      },
    },
  })
  @ApiResponse({ status: 404, description: "Backtest not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getBacktest(
    @Param("id") backtestId: string,
    @CurrentUser("id") userId: string
  ) {
    return this.backtestingService.getBacktestById(backtestId, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: "id", description: "Backtest ID" })
  @ApiOperation({
    summary: "Delete backtest",
    description: "Deletes a backtest and all its associated data",
  })
  @ApiResponse({ status: 204, description: "Backtest deleted successfully" })
  @ApiResponse({ status: 404, description: "Backtest not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteBacktest(
    @Param("id") backtestId: string,
    @CurrentUser("id") userId: string
  ) {
    await this.backtestingService.deleteBacktest(backtestId, userId);
  }
}
