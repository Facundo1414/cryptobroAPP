import { Module } from "@nestjs/common";
import { CryptoService } from "./crypto.service";
import { CryptoController } from "./crypto.controller";
import { PrismaModule } from "@/common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CryptoController],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
