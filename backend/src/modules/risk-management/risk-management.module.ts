import { Module } from "@nestjs/common";
import { RiskManagementService } from "./risk-management.service";
import { RiskManagementController } from "./risk-management.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [RiskManagementController],
  providers: [RiskManagementService],
  exports: [RiskManagementService],
})
export class RiskManagementModule {}
