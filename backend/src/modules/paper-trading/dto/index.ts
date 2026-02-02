import { IsNumber, IsString, IsOptional, Min, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePortfolioDto {
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(100)
  initialBalance: number;
}

export class OpenTradeDto {
  @ApiProperty({ example: "BTCUSDT" })
  @IsString()
  symbol: string;

  @ApiProperty({ example: "BUY", enum: ["BUY", "SELL"] })
  @IsEnum(["BUY", "SELL"])
  side: "BUY" | "SELL";

  @ApiProperty({ example: "MARKET" })
  @IsString()
  type: string;

  @ApiProperty({ example: 0.01 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ example: 40000 })
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  takeProfit?: number;
}
