import { Injectable } from "@nestjs/common";
import type { ReservaIngresso } from "@prisma/client";
import type { StatusReserva } from "@events-platform/shared-types";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ReservaModel } from "../model/reserva.model";
import type { CarrinhoAbandonadoItem, CriarReservaData, ReservaRepository } from "./reserva.repository";

@Injectable()
export class PrismaReservaRepository implements ReservaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarReservaData): Promise<ReservaModel> {
    const reserva = await this.prisma.reservaIngresso.create({ data });
    return this.toModel(reserva);
  }

  async buscarPorId(id: string): Promise<ReservaModel | null> {
    const reserva = await this.prisma.reservaIngresso.findUnique({ where: { id } });
    return reserva ? this.toModel(reserva) : null;
  }

  async atualizarStatus(id: string, status: StatusReserva): Promise<ReservaModel> {
    const reserva = await this.prisma.reservaIngresso.update({ where: { id }, data: { status } });
    return this.toModel(reserva);
  }

  async listarAtivasVencidas(loteId: string, agora: Date): Promise<ReservaModel[]> {
    const reservas = await this.prisma.reservaIngresso.findMany({
      where: { loteId, status: "ativa", expiraEm: { lt: agora } },
    });
    return reservas.map((reserva) => this.toModel(reserva));
  }

  async listarAbandonadasPorEvento(eventoId: string): Promise<CarrinhoAbandonadoItem[]> {
    const reservas = await this.prisma.reservaIngresso.findMany({
      where: {
        lote: { eventoId },
        OR: [{ status: "expirada" }, { status: "ativa", expiraEm: { lt: new Date() } }],
      },
      include: { lote: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    });
    return reservas.map((reserva) => ({
      id: reserva.id,
      loteNome: reserva.lote.nome,
      compradorNome: reserva.compradorNome,
      compradorEmail: reserva.compradorEmail,
      compradorTelefone: reserva.compradorTelefone,
      criadoEm: reserva.criadoEm,
      expiraEm: reserva.expiraEm,
    }));
  }

  private toModel(reserva: ReservaIngresso): ReservaModel {
    return new ReservaModel(
      reserva.id,
      reserva.loteId,
      reserva.status,
      reserva.expiraEm,
      reserva.compradorEmail,
      reserva.compradorNome,
      reserva.compradorTelefone,
      reserva.criadoEm,
    );
  }
}
