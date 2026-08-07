import { Injectable } from "@nestjs/common";
import type { Lote } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { LoteModel } from "../model/lote.model";
import type { AtualizarLoteData, CriarLoteData, LoteRepository } from "./lote.repository";

type LoteComContagem = Lote & { _count: { ingressos: number } };

@Injectable()
export class PrismaLoteRepository implements LoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarLoteData): Promise<LoteModel> {
    const lote = await this.prisma.lote.create({
      data,
      include: { _count: { select: { ingressos: true } } },
    });
    return this.toModel(lote);
  }

  async buscarPorId(id: string): Promise<LoteModel | null> {
    const lote = await this.prisma.lote.findUnique({
      where: { id },
      include: { _count: { select: { ingressos: true } } },
    });
    return lote ? this.toModel(lote) : null;
  }

  async atualizar(id: string, data: AtualizarLoteData): Promise<LoteModel> {
    const lote = await this.prisma.lote.update({
      where: { id },
      data,
      include: { _count: { select: { ingressos: true } } },
    });
    return this.toModel(lote);
  }

  async listarPorEvento(eventoId: string): Promise<LoteModel[]> {
    const lotes = await this.prisma.lote.findMany({
      where: { eventoId },
      include: { _count: { select: { ingressos: true } } },
      orderBy: { criadoEm: "asc" },
    });
    return lotes.map((lote) => this.toModel(lote));
  }

  private toModel(lote: LoteComContagem): LoteModel {
    return new LoteModel(
      lote.id,
      lote.eventoId,
      lote.nome,
      Number(lote.preco),
      lote.quantidade,
      lote._count.ingressos,
    );
  }
}
