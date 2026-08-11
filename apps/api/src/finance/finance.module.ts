import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { ContaBancariaMapper } from "./mapper/conta-bancaria.mapper";
import { CONTA_BANCARIA_REPOSITORY } from "./repository/conta-bancaria.repository";
import { PrismaContaBancariaRepository } from "./repository/prisma-conta-bancaria.repository";
import { DistribuicaoTaxaService } from "./distribuicao-taxa.service";

@Module({
  controllers: [FinanceController],
  providers: [
    FinanceService,
    ContaBancariaMapper,
    DistribuicaoTaxaService,
    { provide: CONTA_BANCARIA_REPOSITORY, useClass: PrismaContaBancariaRepository },
  ],
  exports: [DistribuicaoTaxaService, FinanceService],
})
export class FinanceModule {}
