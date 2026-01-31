import { Controller, Post, Body, Get, UseGuards } from "@nestjs/common";
import {
  RiskManagementService,
  PositionSizeParams,
  Position,
  TrailingStopConfig,
} from "./risk-management.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("risk")
@UseGuards(JwtAuthGuard)
export class RiskManagementController {
  constructor(private readonly riskService: RiskManagementService) {}

  /**
   * Calculate optimal position size
   */
  @Post("position-size")
  calculatePositionSize(@Body() params: PositionSizeParams) {
    return this.riskService.calculatePositionSize(params);
  }

  /**
   * Calculate position size with take profit (R:R ratio)
   */
  @Post("position-size-rr")
  calculatePositionSizeWithRR(
    @Body() body: PositionSizeParams & { takeProfitPrice: number },
  ) {
    const { takeProfitPrice, ...params } = body;
    return this.riskService.calculatePositionSizeWithRR(
      params,
      takeProfitPrice,
    );
  }

  /**
   * Calculate Kelly Criterion bet size
   */
  @Post("kelly")
  calculateKellySize(
    @Body() body: { winRate: number; avgWin: number; avgLoss: number },
  ) {
    const kellyPercent = this.riskService.calculateKellySize(
      body.winRate,
      body.avgWin,
      body.avgLoss,
    );
    return {
      fullKelly: kellyPercent * 2,
      halfKelly: kellyPercent,
      quarterKelly: kellyPercent / 2,
      recommendation:
        kellyPercent > 0.15
          ? "Consider using Half-Kelly for safety"
          : "Kelly size within safe limits",
    };
  }

  /**
   * Analyze portfolio risk
   */
  @Post("analyze-portfolio")
  analyzePortfolioRisk(
    @Body() body: { positions: Position[]; accountBalance: number },
  ) {
    return this.riskService.analyzePortfolioRisk(
      body.positions,
      body.accountBalance,
    );
  }

  /**
   * Calculate trailing stop level
   */
  @Post("trailing-stop")
  calculateTrailingStop(
    @Body()
    body: {
      position: Position;
      config: TrailingStopConfig;
      highestPrice: number;
      lowestPrice: number;
    },
  ) {
    return this.riskService.calculateTrailingStop(
      body.position,
      body.config,
      body.highestPrice,
      body.lowestPrice,
    );
  }

  /**
   * Compare strategies risk metrics
   */
  @Post("compare-strategies")
  compareStrategies(
    @Body()
    body: {
      strategies: Array<{
        name: string;
        returns: number[];
        maxDrawdown: number;
      }>;
    },
  ) {
    return this.riskService.compareStrategiesRisk(body.strategies);
  }
}
