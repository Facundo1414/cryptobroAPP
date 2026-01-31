import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from "@nestjs/swagger";
import { AlertsService } from "./alerts.service";
import { CreateAlertDto, UpdateAlertDto } from "./dto/alert.dto";
import { AlertStatus } from "@prisma/client";

@ApiTags("alerts")
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new alert" })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: "Get alerts for current user" })
  @ApiQuery({ name: "status", required: false, enum: AlertStatus })
  findAllForCurrentUser(@Query("status") status?: AlertStatus) {
    // TODO: Get userId from JWT token
    const userId = "mock-user-id";
    return this.alertsService.findAll(userId, status);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get all alerts for a user" })
  @ApiParam({ name: "userId", example: "user-id-here" })
  @ApiQuery({ name: "status", required: false, enum: AlertStatus })
  findAll(
    @Param("userId") userId: string,
    @Query("status") status?: AlertStatus,
  ) {
    return this.alertsService.findAll(userId, status);
  }

  @Get("statistics/:userId")
  @ApiOperation({ summary: "Get alert statistics for a user" })
  @ApiParam({ name: "userId", example: "user-id-here" })
  getStatistics(@Param("userId") userId: string) {
    return this.alertsService.getStatistics(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an alert by ID" })
  findOne(@Param("id") id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an alert" })
  update(@Param("id") id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.update(id, updateAlertDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an alert" })
  remove(@Param("id") id: string) {
    return this.alertsService.remove(id);
  }

  @Post("from-signal/:userId/:signalId")
  @ApiOperation({ summary: "Create alert from a trading signal" })
  @ApiParam({ name: "userId", example: "user-id-here" })
  @ApiParam({ name: "signalId", example: "signal-id-here" })
  createFromSignal(
    @Param("userId") userId: string,
    @Param("signalId") signalId: string,
  ) {
    return this.alertsService.createAlertFromSignal(userId, signalId);
  }
}
