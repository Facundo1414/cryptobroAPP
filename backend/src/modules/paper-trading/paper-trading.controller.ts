import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PaperTradingService } from "./paper-trading.service";
import { CreatePortfolioDto, OpenTradeDto } from "./dto";

@ApiTags("paper-trading")
@Controller("paper-trading")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaperTradingController {
  constructor(private readonly paperTradingService: PaperTradingService) {}

  @Post("portfolio")
  @ApiOperation({ summary: "Create paper trading portfolio" })
  async createPortfolio(@Request() req: any, @Body() dto: CreatePortfolioDto) {
    return this.paperTradingService.createPortfolio(req.user.userId, dto);
  }

  @Get("portfolio")
  @ApiOperation({ summary: "Get user portfolio" })
  async getPortfolio(@Request() req: any) {
    return this.paperTradingService.getPortfolio(req.user.userId);
  }

  @Get("portfolio/stats")
  @ApiOperation({ summary: "Get portfolio statistics" })
  async getPortfolioStats(@Request() req: any) {
    return this.paperTradingService.getPortfolioStats(req.user.userId);
  }

  @Post("portfolio/reset")
  @ApiOperation({ summary: "Reset portfolio" })
  async resetPortfolio(@Request() req: any) {
    return this.paperTradingService.resetPortfolio(req.user.userId);
  }

  @Post("trade/open")
  @ApiOperation({ summary: "Open a new trade" })
  async openTrade(@Request() req: any, @Body() dto: OpenTradeDto) {
    return this.paperTradingService.openTrade(req.user.userId, dto);
  }

  @Post("trade/close")
  @ApiOperation({ summary: "Close a trade" })
  async closeTrade(@Request() req: any, @Body() body: { tradeId: string }) {
    return this.paperTradingService.closeTrade(req.user.userId, body.tradeId);
  }

  @Get("trades/open")
  @ApiOperation({ summary: "Get open trades" })
  async getOpenTrades(@Request() req: any) {
    return this.paperTradingService.getOpenTrades(req.user.userId);
  }

  @Get("trades/history")
  @ApiOperation({ summary: "Get trade history" })
  async getTradeHistory(@Request() req: any, @Query("limit") limit?: number) {
    return this.paperTradingService.getTradeHistory(
      req.user.userId,
      limit ? parseInt(limit.toString()) : 20,
    );
  }
}
