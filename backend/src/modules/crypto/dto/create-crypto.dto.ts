import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCryptoDto {
  @ApiProperty({ example: "Bitcoin" })
  @IsString()
  name: string;

  @ApiProperty({ example: "BTC" })
  @IsString()
  symbol: string;

  @ApiProperty({ example: "BTCUSDT" })
  @IsString()
  binanceSymbol: string;

  @ApiPropertyOptional({ example: "A decentralized digital currency" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "https://bitcoin.org/img/icons/logotop.svg" })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
