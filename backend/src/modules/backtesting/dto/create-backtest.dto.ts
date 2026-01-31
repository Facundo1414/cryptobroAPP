import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from "class-validator";

export class CreateBacktestDto {
  @ApiProperty({
    description: "Strategy ID to backtest",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsString()
  strategyId: string;

  @ApiProperty({
    description: "Cryptocurrency symbol (e.g., BTC, ETH)",
    example: "BTC",
  })
  @IsString()
  cryptoSymbol: string;

  @ApiProperty({
    description: "Start date for backtest (ISO 8601)",
    example: "2023-01-01T00:00:00Z",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "End date for backtest (ISO 8601)",
    example: "2023-12-31T23:59:59Z",
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: "Initial capital in USD",
    example: 10000,
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  initialCapital: number;

  @ApiPropertyOptional({
    description: "Timeframe for candles (1m, 5m, 15m, 1h, 4h, 1d)",
    example: "1h",
    default: "1h",
  })
  @IsOptional()
  @IsString()
  timeframe?: string = "1h";

  @ApiPropertyOptional({
    description: "Trading fee percentage",
    example: 0.1,
    default: 0.1,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  tradingFee?: number = 0.1;

  @ApiPropertyOptional({
    description: "Slippage percentage",
    example: 0.05,
    default: 0.05,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  slippage?: number = 0.05;
}
