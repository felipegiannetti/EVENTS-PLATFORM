import type { StatusReserva } from "@events-platform/shared-types";
import type { ReservaModel } from "../model/reserva.model";

export const RESERVA_REPOSITORY = Symbol("RESERVA_REPOSITORY");

export interface CriarReservaData {
  id: string;
  loteId: string;
  expiraEm: Date;
  compradorEmail?: string;
}

export interface ReservaRepository {
  criar(data: CriarReservaData): Promise<ReservaModel>;
  buscarPorId(id: string): Promise<ReservaModel | null>;
  atualizarStatus(id: string, status: StatusReserva): Promise<ReservaModel>;
  /** Reservas 'ativa' com expiraEm no passado, pra esse lote — base da expiração lazy (ver TicketsService.expirarReservasVencidas). */
  listarAtivasVencidas(loteId: string, agora: Date): Promise<ReservaModel[]>;
}
