import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SignalType } from "@prisma/client";

export class CreateSignalDto {
  @ApiProperty({ example: "crypto-id-here" })
  @IsString()
  cryptoId: string;

  @ApiProperty({ example: "strategy-id-here" })
  @IsString()
  strategyId: string;

  @ApiProperty({ enum: SignalType, example: "BUY" })
  @IsEnum(SignalType)
  type: SignalType;

  @ApiProperty({ example: 43523.5 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: "1h" })
  @IsString()
  timeframe: string;

  @ApiProperty({ example: 0.85 })
  @IsNumber()
  confidence: number;

  @ApiPropertyOptional({ example: 42652.23 })
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiPropertyOptional({ example: 44611.59 })
  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ example: "RSI oversold with volume confirmation" })
  @IsOptional()
  @IsString()
  reasoning?: string;
}
