import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetNewsDto {
  @ApiPropertyOptional({ description: "Filter by cryptocurrency symbol" })
  @IsOptional()
  @IsString()
  crypto?: string;

  @ApiPropertyOptional({
    description: "Filter by sentiment",
    enum: ["positive", "negative", "neutral"],
  })
  @IsOptional()
  @IsEnum(["positive", "negative", "neutral"])
  sentiment?: "positive" | "negative" | "neutral";

  @ApiPropertyOptional({ description: "Filter by news source" })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: "Number of articles to return",
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
