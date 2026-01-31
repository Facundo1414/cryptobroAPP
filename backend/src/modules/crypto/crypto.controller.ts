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
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { CryptoService } from "./crypto.service";
import { CreateCryptoDto } from "./dto/create-crypto.dto";
import { UpdateCryptoDto } from "./dto/update-crypto.dto";

@ApiTags("crypto")
@Controller("crypto")
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post()
  @ApiOperation({ summary: "Create a new cryptocurrency" })
  create(@Body() createCryptoDto: CreateCryptoDto) {
    return this.cryptoService.create(createCryptoDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all cryptocurrencies" })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  findAll(@Query("includeInactive") includeInactive?: boolean) {
    return this.cryptoService.findAll(includeInactive);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a cryptocurrency by ID" })
  findOne(@Param("id") id: string) {
    return this.cryptoService.findOne(id);
  }

  @Get("symbol/:symbol")
  @ApiOperation({ summary: "Get a cryptocurrency by symbol" })
  findBySymbol(@Param("symbol") symbol: string) {
    return this.cryptoService.findBySymbol(symbol);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a cryptocurrency" })
  update(@Param("id") id: string, @Body() updateCryptoDto: UpdateCryptoDto) {
    return this.cryptoService.update(id, updateCryptoDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a cryptocurrency" })
  remove(@Param("id") id: string) {
    return this.cryptoService.remove(id);
  }

  @Post("seed")
  @ApiOperation({ summary: "Seed initial cryptocurrencies" })
  seed() {
    return this.cryptoService.seed();
  }
}
