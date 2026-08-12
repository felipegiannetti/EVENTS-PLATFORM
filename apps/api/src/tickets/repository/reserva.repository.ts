import type { StatusReserva } from "@events-platform/shared-types";
import type { ReservaModel } from "../model/reserva.model";

export const RESERVA_REPOSITORY = Symbol("RESERVA_REPOSITORY");

export interface CriarReservaData {
  id: string;
  loteId: string;
  expiraEm: Date;
  compradorEmail?: string;
  compradorNome?: string;
  compradorTelefone?: string;
}

/** Reserva 'expirada' (ou 'ativa' já vencida) com o nome do lote — linha do relatório de carrinho abandonado. */
export interface CarrinhoAbandonadoItem {
  id: string;
  loteNome: string;
  compradorNome: string | null;
  compradorEmail: string | null;
  compradorTelefone: string | null;
  criadoEm: Date;
  expiraEm: Date;
}

export interface ReservaRepository {
  criar(data: CriarReservaData): Promise<ReservaModel>;
  buscarPorId(id: string): Promise<ReservaModel | null>;
  atualizarStatus(id: string, status: StatusReserva): Promise<ReservaModel>;
  /** Reservas 'ativa' com expiraEm no passado, pra esse lote — base da expiração lazy (ver TicketsService.expirarReservasVencidas). */
  listarAtivasVencidas(loteId: string, agora: Date): Promise<ReservaModel[]>;
  /** Reservas do evento que nunca viraram ingresso — 'expirada', ou 'ativa' já com expiraEm no passado (expiração lazy ainda não rodou pra elas). Nunca inclui 'confirmada'/'cancelada'. */
  listarAbandonadasPorEvento(eventoId: string): Promise<CarrinhoAbandonadoItem[]>;
}
