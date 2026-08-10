import { Injectable } from "@nestjs/common";
import type { Lote } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { LoteModel } from "../model/lote.model";
import type { AtualizarLoteData, CriarLoteData, LoteRepository } from "./lote.repository";

@Injectable()
export class PrismaLoteRepository implements LoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarLoteData): Promise<LoteModel> {
    const lote = await this.prisma.lote.create({ data });
    return this.toModel(lote);
  }

  async buscarPorId(id: string): Promise<LoteModel | null> {
    const lote = await this.prisma.lote.findUnique({ where: { id } });
    return lote ? this.toModel(lote) : null;
  }

  async atualizar(id: string, data: AtualizarLoteData): Promise<LoteModel> {
    const lote = await this.prisma.lote.update({ where: { id }, data });
    return this.toModel(lote);
  }

  async listarPorEvento(eventoId: string): Promise<LoteModel[]> {
    const lotes = await this.prisma.lote.findMany({
      where: { eventoId },
      orderBy: { criadoEm: "asc" },
    });
    return lotes.map((lote) => this.toModel(lote));
  }

  async ocuparVagaEmitidaSeDisponivel(loteId: string): Promise<boolean> {
    const linhasAfetadas = await this.prisma.$executeRaw`
      UPDATE "lotes" SET "quantidadeEmitida" = "quantidadeEmitida" + 1
      WHERE "id" = ${loteId} AND "quantidadeEmitida" + "vagasReservadas" < "quantidade"
    `;
    return linhasAfetadas === 1;
  }

  async liberarVagaEmitida(loteId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "lotes" SET "quantidadeEmitida" = "quantidadeEmitida" - 1
      WHERE "id" = ${loteId} AND "quantidadeEmitida" > 0
    `;
  }

  async ocuparVagaReservadaSeDisponivel(loteId: string): Promise<boolean> {
    const linhasAfetadas = await this.prisma.$executeRaw`
      UPDATE "lotes" SET "vagasReservadas" = "vagasReservadas" + 1
      WHERE "id" = ${loteId} AND "quantidadeEmitida" + "vagasReservadas" < "quantidade"
    `;
    return linhasAfetadas === 1;
  }

  async confirmarVagaReservada(loteId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "lotes" SET "quantidadeEmitida" = "quantidadeEmitida" + 1, "vagasReservadas" = "vagasReservadas" - 1
      WHERE "id" = ${loteId} AND "vagasReservadas" > 0
    `;
  }

  async liberarVagaReservada(loteId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "lotes" SET "vagasReservadas" = "vagasReservadas" - 1
      WHERE "id" = ${loteId} AND "vagasReservadas" > 0
    `;
  }

  private toModel(lote: Lote): LoteModel {
    return new LoteModel(
      lote.id,
      lote.eventoId,
      lote.nome,
      Number(lote.preco),
      lote.quantidade,
      lote.quantidadeEmitida,
      lote.especial,
    );
  }
}
