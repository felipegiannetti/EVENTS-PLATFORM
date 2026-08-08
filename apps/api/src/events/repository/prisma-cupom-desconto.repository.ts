import { Injectable } from "@nestjs/common";
import type { CupomDesconto } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { CupomDescontoModel } from "../model/cupom-desconto.model";
import type {
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

  async atualizarAtivo(id: string, ativo: boolean): Promise<CupomDescontoModel> {
    const cupom = await this.prisma.cupomDesconto.update({ where: { id }, data: { ativo } });
    return this.toModel(cupom);
  }

  async remover(id: string): Promise<void> {
    await this.prisma.cupomDesconto.delete({ where: { id } });
  }

  private toModel(cupom: CupomDesconto): CupomDescontoModel {
    return new CupomDescontoModel(
      cupom.id,
      cupom.eventoId,
      cupom.codigo,
      cupom.tipo,
      Number(cupom.valor),
      cupom.ativo,
      cupom.usos,
      cupom.criadoEm,
    );
  }
}
