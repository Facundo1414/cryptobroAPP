import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AddToWatchlistDto {
  @ApiProperty({ example: "BTC" })
  @IsString()
  cryptoSymbol: string;

  @ApiPropertyOptional({ example: "Watching for breakout" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  alertOnBuy?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  alertOnSell?: boolean;
}

export class UpdateWatchlistDto {
  @ApiPropertyOptional({ example: "Updated notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  alertOnBuy?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  alertOnSell?: boolean;
}
