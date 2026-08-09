import { Injectable } from "@nestjs/common";
import type { CupomDesconto } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CupomDescontoModel } from "../model/cupom-desconto.model";
import type {
  AtualizarCupomDescontoData,
  CriarCupomDescontoData,
  CupomDescontoRepository,
} from "./cupom-desconto.repository";

@Injectable()
export class PrismaCupomDescontoRepository implements CupomDescontoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarCupomDescontoData): Promise<CupomDescontoModel> {
    const cupom = await this.prisma.cupomDesconto.create({ data });
    return this.toModel(cupom);
  }

  async buscarPorId(id: string): Promise<CupomDescontoModel | null> {
    const cupom = await this.prisma.cupomDesconto.findUnique({ where: { id } });
    return cupom ? this.toModel(cupom) : null;
  }

  async listarPorEvento(eventoId: string): Promise<CupomDescontoModel[]> {
    const cupons = await this.prisma.cupomDesconto.findMany({
      where: { eventoId },
      orderBy: { criadoEm: "asc" },
    });
    return cupons.map((cupom) => this.toModel(cupom));
  }

  async atualizar(id: string, data: AtualizarCupomDescontoData): Promise<CupomDescontoModel> {
    const cupom = await this.prisma.cupomDesconto.update({
      where: { id },
      data: {
        codigo: data.codigo,
        tipo: data.tipo,
        valor: data.valor,
        limiteUsos: data.limiteUsos ?? null,
        ativo: data.ativo,
      },
    });
    return this.toModel(cupom);
  }

  async remover(id: string): Promise<void> {
    await this.prisma.cupomDesconto.delete({ where: { id } });
  }

  async incrementarUsos(id: string): Promise<void> {
    await this.prisma.cupomDesconto.update({ where: { id }, data: { usos: { increment: 1 } } });
  }

  /** `where: usos > 0` evita ir negativo — não deveria acontecer com a contabilidade consistente, mas é barato garantir. */
  async decrementarUsos(id: string): Promise<void> {
    await this.prisma.cupomDesconto.updateMany({ where: { id, usos: { gt: 0 } }, data: { usos: { decrement: 1 } } });
  }

  private toModel(cupom: CupomDesconto): CupomDescontoModel {
    return new CupomDescontoModel(
      cupom.id,
      cupom.eventoId,
      cupom.codigo,
      cupom.tipo,
      Number(cupom.valor),
      cupom.ativo,
      cupom.limiteUsos,
      cupom.usos,
      cupom.criadoEm,
    );
  }
}
