import { Injectable } from "@nestjs/common";
import type { Evento } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EventoModel } from "../model/evento.model";
import type { AtualizarEventoData, CriarEventoData, EventoRepository } from "./evento.repository";

@Injectable()
export class PrismaEventoRepository implements EventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarEventoData): Promise<EventoModel> {
    const evento = await this.prisma.evento.create({ data });
    return this.toModel(evento);
  }

  async buscarPorId(id: string): Promise<EventoModel | null> {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    return evento ? this.toModel(evento) : null;
  }

  async atualizar(id: string, data: AtualizarEventoData): Promise<EventoModel> {
    const evento = await this.prisma.evento.update({ where: { id }, data });
    return this.toModel(evento);
  }

  async listarPorUsuario(usuarioId: string): Promise<EventoModel[]> {
    const eventos = await this.prisma.evento.findMany({
      where: { papeisAcesso: { some: { usuarioId } } },
      orderBy: { data: "asc" },
    });
    return eventos.map((evento) => this.toModel(evento));
  }

  private toModel(evento: Evento): EventoModel {
    return new EventoModel(
      evento.id,
      evento.nome,
      evento.data,
      evento.local,
      evento.transferivel,
      evento.taxaPagaPor,
      evento.criadoEm,
    );
  }
}
