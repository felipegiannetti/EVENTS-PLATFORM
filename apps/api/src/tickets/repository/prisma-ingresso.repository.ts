import { Injectable } from "@nestjs/common";
import type { Ingresso } from "@prisma/client";
import type { StatusIngresso } from "@events-platform/shared-types";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { IngressoModel } from "../model/ingresso.model";
import { MeuIngressoModel } from "../model/meu-ingresso.model";
import type { CriarIngressoData, IngressoRepository } from "./ingresso.repository";

@Injectable()
export class PrismaIngressoRepository implements IngressoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarIngressoData): Promise<IngressoModel> {
    const ingresso = await this.prisma.ingresso.create({ data });
    return this.toModel(ingresso);
  }

  async buscarPorId(id: string): Promise<IngressoModel | null> {
    const ingresso = await this.prisma.ingresso.findUnique({ where: { id } });
    return ingresso ? this.toModel(ingresso) : null;
  }

  /** version incrementado a cada troca de status — usado pelo módulo checkin (futuro) como lock otimista. */
  async atualizarStatus(id: string, status: StatusIngresso): Promise<IngressoModel> {
    const ingresso = await this.prisma.ingresso.update({
      where: { id },
      data: { status, version: { increment: 1 } },
    });
    return this.toModel(ingresso);
  }

  async listarPorEvento(eventoId: string): Promise<IngressoModel[]> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: { eventoId },
      orderBy: { criadoEm: "asc" },
    });
    return ingressos.map((ingresso) => this.toModel(ingresso));
  }

  async listarEmailsCompradoresPorEvento(eventoId: string): Promise<string[]> {
    const linhas = await this.prisma.ingresso.findMany({
      where: { eventoId, compradorEmail: { not: null } },
      distinct: ["compradorEmail"],
      select: { compradorEmail: true },
    });
    return linhas.map((linha) => linha.compradorEmail).filter((email): email is string => Boolean(email));
  }

  async marcarComoUsadoSeValido(id: string): Promise<boolean> {
    const resultado = await this.prisma.ingresso.updateMany({
      where: { id, status: "valido" },
      data: { status: "usado", version: { increment: 1 } },
    });
    return resultado.count === 1;
  }

  async listarPorCompradorEmail(email: string): Promise<MeuIngressoModel[]> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: { compradorEmail: email },
      orderBy: { criadoEm: "desc" },
      include: { evento: { select: { nome: true, data: true } } },
    });
    return ingressos.map((ingresso) => new MeuIngressoModel(this.toModel(ingresso), ingresso.evento.nome, ingresso.evento.data));
  }

  private toModel(ingresso: Ingresso): IngressoModel {
    return new IngressoModel(
      ingresso.id,
      ingresso.eventoId,
      ingresso.loteId,
      ingresso.linkVendaId,
      ingresso.status,
      ingresso.qrToken,
      ingresso.transferivel,
      ingresso.compradorNome,
      ingresso.compradorEmail,
      ingresso.compradorDocumento,
      ingresso.criadoEm,
    );
  }
}
