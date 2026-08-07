import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { ContaBancariaMapper } from "./mapper/conta-bancaria.mapper";
import { CONTA_BANCARIA_REPOSITORY } from "./repository/conta-bancaria.repository";
import { PrismaContaBancariaRepository } from "./repository/prisma-conta-bancaria.repository";

@Module({
  controllers: [FinanceController],
  providers: [
    FinanceService,
    ContaBancariaMapper,
    { provide: CONTA_BANCARIA_REPOSITORY, useClass: PrismaContaBancariaRepository },
  ],
})
export class FinanceModule {}
