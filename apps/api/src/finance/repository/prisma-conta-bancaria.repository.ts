import { Injectable } from "@nestjs/common";
import type { ContaBancaria } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ContaBancariaModel } from "../model/conta-bancaria.model";
import type {
  ContaBancariaRepository,
  UpsertContaBancariaData,
} from "./conta-bancaria.repository";

@Injectable()
export class PrismaContaBancariaRepository implements ContaBancariaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: UpsertContaBancariaData): Promise<ContaBancariaModel> {
    const { eventoId, ...resto } = data;
    const conta = await this.prisma.contaBancaria.upsert({
      where: { eventoId },
      update: resto,
      create: data,
    });
    return this.toModel(conta);
  }

  async buscarPorEvento(eventoId: string): Promise<ContaBancariaModel | null> {
    const conta = await this.prisma.contaBancaria.findUnique({ where: { eventoId } });
    return conta ? this.toModel(conta) : null;
  }

  private toModel(conta: ContaBancaria): ContaBancariaModel {
    return new ContaBancariaModel(
      conta.eventoId,
      conta.banco,
      conta.agencia,
      conta.conta,
      conta.tipoConta,
      conta.titular,
      conta.documentoTitular,
      conta.atualizadoEm,
    );
  }
}
