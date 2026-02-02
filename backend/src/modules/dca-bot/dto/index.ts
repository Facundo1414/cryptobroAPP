import { IsNumber, IsString, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDCABotDto {
  @ApiProperty({ example: "My DCA Bot" })
  @IsString()
  name: string;

  @ApiProperty({ example: "BTCUSDT" })
  @IsString()
  symbol: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(10)
  baseOrderSize: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(5)
  safetyOrderSize: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  maxSafetyOrders: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  priceDeviation: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(5)
  safetyOrderStep: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.5)
  @Max(20)
  takeProfitPercent: number;
}

export class PreviewDCABotDto extends CreateDCABotDto {}
