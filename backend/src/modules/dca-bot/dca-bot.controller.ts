import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DCABotService } from "./dca-bot.service";
import { CreateDCABotDto, PreviewDCABotDto } from "./dto";

@ApiTags("dca-bot")
@Controller("dca-bot")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DCABotController {
  constructor(private readonly dcaBotService: DCABotService) {}

  @Post()
  @ApiOperation({ summary: "Create DCA bot" })
  async createBot(@Request() req: any, @Body() dto: CreateDCABotDto) {
    return this.dcaBotService.createBot(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get user's DCA bots" })
  async getBots(@Request() req: any) {
    return this.dcaBotService.getBots(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get bot by ID" })
  async getBot(@Request() req: any, @Param("id") id: string) {
    return this.dcaBotService.getBot(req.user.userId, id);
  }

  @Get(":id/status")
  @ApiOperation({ summary: "Get bot status" })
  async getBotStatus(@Request() req: any, @Param("id") id: string) {
    return this.dcaBotService.getBotStatus(req.user.userId, id);
  }

  @Post(":id/start")
  @ApiOperation({ summary: "Start bot" })
  async startBot(@Request() req: any, @Param("id") id: string) {
    return this.dcaBotService.startBot(req.user.userId, id);
  }

  @Post(":id/stop")
  @ApiOperation({ summary: "Stop bot" })
  async stopBot(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: { sellPosition?: boolean },
  ) {
    return this.dcaBotService.stopBot(
      req.user.userId,
      id,
      body.sellPosition || false,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete bot" })
  async deleteBot(@Request() req: any, @Param("id") id: string) {
    return this.dcaBotService.deleteBot(req.user.userId, id);
  }

  @Post("preview")
  @ApiOperation({ summary: "Preview DCA setup" })
  async previewSetup(@Request() req: any, @Body() dto: PreviewDCABotDto) {
    return this.dcaBotService.previewSetup(dto);
  }
}
