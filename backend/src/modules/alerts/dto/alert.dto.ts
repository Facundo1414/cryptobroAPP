import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AlertStatus } from "@prisma/client";

export class CreateAlertDto {
  @ApiProperty({ example: "user-id-here" })
  @IsString()
  userId: string;

  @ApiProperty({ example: "crypto-id-here" })
  @IsString()
  cryptoId: string;

  @ApiPropertyOptional({ example: "BUY" })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  targetPrice: number;

  @ApiPropertyOptional({ example: "Price Alert: BTC reached $45,000" })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  notifyPush?: boolean;
}

export class UpdateAlertDto {
  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyPush?: boolean;
}
