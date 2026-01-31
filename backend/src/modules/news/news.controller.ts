import { Controller, Get, Query } from "@nestjs/common"; // , UseGuards
import { ApiTags, ApiOperation } from "@nestjs/swagger"; // , ApiBearerAuth
import { NewsService } from "./news.service";
import { GetNewsDto } from "./dto/get-news.dto";
// import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"; // TODO: Fix auth

@ApiTags("News")
// @ApiBearerAuth() // TODO: Uncomment when auth is fixed
// @UseGuards(JwtAuthGuard) // TODO: Uncomment when auth is fixed
@Controller("news")
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: "Get crypto news with filters" })
  async getNews(@Query() filters: GetNewsDto) {
    return this.newsService.getNews(filters);
  }

  @Get("trending")
  @ApiOperation({ summary: "Get trending crypto news" })
  async getTrendingNews() {
    return this.newsService.getTrendingNews();
  }

  @Get("crypto/:symbol")
  @ApiOperation({ summary: "Get news for specific cryptocurrency" })
  async getNewsByCrypto(@Query("symbol") symbol: string) {
    return this.newsService.getNewsByCrypto(symbol);
  }
}
