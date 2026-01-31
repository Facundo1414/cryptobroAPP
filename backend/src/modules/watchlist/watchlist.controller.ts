import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WatchlistService } from "./watchlist.service";
import { AddToWatchlistDto, UpdateWatchlistDto } from "./dto/watchlist.dto";

@ApiTags("watchlist")
@Controller("watchlist")
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: "Get user watchlist" })
  async getWatchlist(@Request() req: any) {
    const userId = req.user?.sub || "mock-user-id"; // TODO: Get from JWT
    return this.watchlistService.getWatchlist(userId);
  }

  @Post()
  @ApiOperation({ summary: "Add crypto to watchlist" })
  async addToWatchlist(@Request() req: any, @Body() dto: AddToWatchlistDto) {
    const userId = req.user?.sub || "mock-user-id";
    return this.watchlistService.addToWatchlist(userId, dto);
  }

  @Delete(":symbol")
  @ApiOperation({ summary: "Remove crypto from watchlist" })
  async removeFromWatchlist(
    @Request() req: any,
    @Param("symbol") symbol: string,
  ) {
    const userId = req.user?.sub || "mock-user-id";
    return this.watchlistService.removeFromWatchlist(userId, symbol);
  }

  @Patch(":symbol")
  @ApiOperation({ summary: "Update watchlist item" })
  async updateWatchlistItem(
    @Request() req: any,
    @Param("symbol") symbol: string,
    @Body() dto: UpdateWatchlistDto,
  ) {
    const userId = req.user?.sub || "mock-user-id";
    return this.watchlistService.updateWatchlistItem(userId, symbol, dto);
  }

  @Get("check/:symbol")
  @ApiOperation({ summary: "Check if crypto is in watchlist" })
  async isInWatchlist(@Request() req: any, @Param("symbol") symbol: string) {
    const userId = req.user?.sub || "mock-user-id";
    const isInWatchlist = await this.watchlistService.isInWatchlist(
      userId,
      symbol,
    );
    return { symbol, isInWatchlist };
  }
}
