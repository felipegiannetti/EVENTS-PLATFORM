import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EventoModel } from "../model/evento.model";
import type {
  AtualizarEventoData,
  BannerEvento,
  CriarEventoData,
  EventoRepository,
} from "./evento.repository";

/** Nunca inclui `imagemBanner` (bytea) aqui — listagens/detalhe não devem carregar o blob inteiro, só `atualizarBanner`/`buscarBanner` tocam nele. */
const SELECT_SEM_BANNER = {
  id: true,
  nome: true,
  data: true,
  dataFim: true,
  cidade: true,
  estado: true,
  pais: true,
  rua: true,
  numero: true,
  complemento: true,
  bairro: true,
  cep: true,
  somenteMaioresDeIdade: true,
  categoria: true,
  transferivel: true,
  prazoTransferenciaHoras: true,
  taxaPagaPor: true,
  publicado: true,
  descricao: true,
  contatoNome: true,
  contatoEmail: true,
  contatoTelefone: true,
  imagemBannerTipo: true,
  criadoEm: true,
} as const;

type EventoSemBanner = {
  id: string;
  nome: string;
  data: Date;
  dataFim: Date | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  somenteMaioresDeIdade: boolean;
  categoria: EventoModel["categoria"];
  transferivel: boolean;
  prazoTransferenciaHoras: number | null;
  taxaPagaPor: EventoModel["taxaPagaPor"];
  publicado: boolean;
  descricao: string | null;
  contatoNome: string | null;
  contatoEmail: string | null;
  contatoTelefone: string | null;
  imagemBannerTipo: string | null;
  criadoEm: Date;
};

@Injectable()
export class PrismaEventoRepository implements EventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarEventoData): Promise<EventoModel> {
    const evento = await this.prisma.evento.create({
      data: {
        ...data,
        local: [data.cidade, data.estado, data.pais].join(", "),
      },
      select: SELECT_SEM_BANNER,
    });
    return this.toModel(evento);
  }

  async buscarPorId(id: string): Promise<EventoModel | null> {
    const evento = await this.prisma.evento.findUnique({ where: { id }, select: SELECT_SEM_BANNER });
    return evento ? this.toModel(evento) : null;
  }

  async atualizar(id: string, data: AtualizarEventoData): Promise<EventoModel> {
    const evento = await this.prisma.evento.update({ where: { id }, data, select: SELECT_SEM_BANNER });
    return this.toModel(evento);
  }

  async listarPorUsuario(usuarioId: string): Promise<EventoModel[]> {
    const eventos = await this.prisma.evento.findMany({
      where: { papeisAcesso: { some: { usuarioId } } },
      orderBy: { data: "asc" },
      select: SELECT_SEM_BANNER,
    });
    return eventos.map((evento) => this.toModel(evento));
  }

  async listarPublicos(): Promise<EventoModel[]> {
    const eventos = await this.prisma.evento.findMany({
      where: { publicado: true },
      orderBy: { data: "asc" },
      select: SELECT_SEM_BANNER,
    });
    return eventos.map((evento) => this.toModel(evento));
  }

  async atualizarBanner(id: string, bytes: Buffer, mimeType: string): Promise<void> {
    await this.prisma.evento.update({
      where: { id },
      data: { imagemBanner: bytes, imagemBannerTipo: mimeType },
    });
  }

  async buscarBanner(id: string): Promise<BannerEvento | null> {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      select: { imagemBanner: true, imagemBannerTipo: true },
    });
    if (!evento?.imagemBanner || !evento.imagemBannerTipo) {
      return null;
    }
    return { bytes: evento.imagemBanner, mimeType: evento.imagemBannerTipo };
  }

  private toModel(evento: EventoSemBanner): EventoModel {
    return new EventoModel(
      evento.id,
      evento.nome,
      evento.data,
      evento.dataFim,
      evento.cidade,
      evento.estado,
      evento.pais,
      evento.rua,
      evento.numero,
      evento.complemento,
      evento.bairro,
      evento.cep,
      evento.somenteMaioresDeIdade,
      evento.categoria,
      evento.transferivel,
      evento.prazoTransferenciaHoras,
      evento.taxaPagaPor,
      evento.publicado,
      evento.descricao,
      evento.contatoNome,
      evento.contatoEmail,
      evento.contatoTelefone,
      evento.imagemBannerTipo !== null,
      evento.criadoEm,
    );
  }
}
