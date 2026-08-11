import { Injectable } from "@nestjs/common";
import type { Ingresso } from "@prisma/client";
import type { StatusIngresso } from "@events-platform/shared-types";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { IngressoModel } from "../model/ingresso.model";
import { MeuIngressoModel } from "../model/meu-ingresso.model";
import type {
  AceitarTransferenciaData,
  AtualizarCompradorData,
  CriarIngressoData,
  IngressoRepository,
} from "./ingresso.repository";

const INCLUI_CUPOM = { cupomDesconto: { select: { codigo: true } } } as const;

type IngressoComCupom = Ingresso & { cupomDesconto: { codigo: string } | null };

@Injectable()
export class PrismaIngressoRepository implements IngressoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarIngressoData): Promise<IngressoModel> {
    const ingresso = await this.prisma.ingresso.create({ data, include: INCLUI_CUPOM });
    return this.toModel(ingresso);
  }

  async buscarPorId(id: string): Promise<IngressoModel | null> {
    const ingresso = await this.prisma.ingresso.findUnique({ where: { id }, include: INCLUI_CUPOM });
    return ingresso ? this.toModel(ingresso) : null;
  }

  /** version incrementado a cada troca de status — usado pelo módulo checkin (futuro) como lock otimista. */
  async atualizarStatus(id: string, status: StatusIngresso): Promise<IngressoModel> {
    const ingresso = await this.prisma.ingresso.update({
      where: { id },
      data: { status, version: { increment: 1 } },
      include: INCLUI_CUPOM,
    });
    return this.toModel(ingresso);
  }

  async atualizarComprador(id: string, data: AtualizarCompradorData): Promise<IngressoModel> {
    const ingresso = await this.prisma.ingresso.update({
      where: { id },
      data: {
        compradorNome: data.compradorNome ?? null,
        compradorEmail: data.compradorEmail,
        compradorDocumento: data.compradorDocumento ?? null,
      },
      include: INCLUI_CUPOM,
    });
    return this.toModel(ingresso);
  }

  async iniciarTransferenciaSePertence(id: string, compradorEmailAtual: string, destinatarioEmail: string): Promise<IngressoModel | null> {
    const resultado = await this.prisma.ingresso.updateMany({
      where: { id, compradorEmail: compradorEmailAtual, status: "valido", transferivel: true },
      data: { status: "aguardando_aceite", destinatarioTransferenciaEmail: destinatarioEmail, version: { increment: 1 } },
    });
    return resultado.count === 1 ? this.buscarPorId(id) : null;
  }

  async cancelarTransferenciaSePertence(id: string, compradorEmailAtual: string): Promise<IngressoModel | null> {
    const resultado = await this.prisma.ingresso.updateMany({
      where: { id, compradorEmail: compradorEmailAtual, status: "aguardando_aceite" },
      data: { status: "valido", destinatarioTransferenciaEmail: null, version: { increment: 1 } },
    });
    return resultado.count === 1 ? this.buscarPorId(id) : null;
  }

  async aceitarTransferenciaSeDestinatario(id: string, destinatarioEmail: string, data: AceitarTransferenciaData): Promise<IngressoModel | null> {
    const resultado = await this.prisma.ingresso.updateMany({
      where: { id, destinatarioTransferenciaEmail: destinatarioEmail, status: "aguardando_aceite" },
      data: {
        status: "valido",
        compradorNome: data.compradorNome,
        compradorEmail: data.compradorEmail,
        compradorDocumento: data.compradorDocumento,
        qrToken: data.qrToken,
        destinatarioTransferenciaEmail: null,
        version: { increment: 1 },
      },
    });
    return resultado.count === 1 ? this.buscarPorId(id) : null;
  }

  async recusarTransferenciaSeDestinatario(id: string, destinatarioEmail: string): Promise<IngressoModel | null> {
    const resultado = await this.prisma.ingresso.updateMany({
      where: { id, destinatarioTransferenciaEmail: destinatarioEmail, status: "aguardando_aceite" },
      data: { status: "valido", destinatarioTransferenciaEmail: null, version: { increment: 1 } },
    });
    return resultado.count === 1 ? this.buscarPorId(id) : null;
  }

  async cancelarSePertence(id: string, compradorEmailAtual: string): Promise<IngressoModel | null> {
    const resultado = await this.prisma.ingresso.updateMany({
      where: { id, compradorEmail: compradorEmailAtual, status: "valido" },
      data: { status: "cancelado", version: { increment: 1 } },
    });
    return resultado.count === 1 ? this.buscarPorId(id) : null;
  }

  async listarPorEvento(eventoId: string): Promise<IngressoModel[]> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: { eventoId },
      orderBy: { criadoEm: "asc" },
      include: INCLUI_CUPOM,
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
      data: { status: "usado", usadoEm: new Date(), version: { increment: 1 } },
    });
    return resultado.count === 1;
  }

  async listarPorCompradorEmail(email: string): Promise<MeuIngressoModel[]> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: { compradorEmail: email },
      orderBy: { criadoEm: "desc" },
      include: {
        ...INCLUI_CUPOM,
        evento: { select: { nome: true, data: true } },
        lote: { select: { nome: true } },
      },
    });
    return ingressos.map(
      (ingresso) => new MeuIngressoModel(this.toModel(ingresso), ingresso.evento.nome, ingresso.evento.data, ingresso.lote.nome),
    );
  }

  async listarTransferenciasPendentesPorDestinatario(email: string): Promise<MeuIngressoModel[]> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: { destinatarioTransferenciaEmail: email, status: "aguardando_aceite" },
      orderBy: { criadoEm: "desc" },
      include: {
        ...INCLUI_CUPOM,
        evento: { select: { nome: true, data: true } },
        lote: { select: { nome: true } },
      },
    });
    return ingressos.map(
      (ingresso) => new MeuIngressoModel(this.toModel(ingresso), ingresso.evento.nome, ingresso.evento.data, ingresso.lote.nome),
    );
  }

  private toModel(ingresso: IngressoComCupom): IngressoModel {
    return new IngressoModel(
      ingresso.id,
      ingresso.eventoId,
      ingresso.loteId,
      ingresso.linkVendaId,
      ingresso.status,
      ingresso.qrToken,
      ingresso.transferivel,
      ingresso.cancelamentoFlexivel,
      ingresso.compradorNome,
      ingresso.compradorEmail,
      ingresso.compradorDocumento,
      ingresso.destinatarioTransferenciaEmail,
      ingresso.cupomDescontoId,
      ingresso.cupomDesconto?.codigo ?? null,
      ingresso.criadoEm,
      ingresso.usadoEm,
    );
  }
}
