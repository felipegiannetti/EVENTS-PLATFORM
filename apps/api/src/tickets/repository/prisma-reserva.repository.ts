import { Injectable } from "@nestjs/common";
import type { ReservaIngresso } from "@prisma/client";
import type { StatusReserva } from "@events-platform/shared-types";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ReservaModel } from "../model/reserva.model";
import type { CriarReservaData, ReservaRepository } from "./reserva.repository";

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

  private toModel(reserva: ReservaIngresso): ReservaModel {
    return new ReservaModel(reserva.id, reserva.loteId, reserva.status, reserva.expiraEm, reserva.compradorEmail, reserva.criadoEm);
  }
}
