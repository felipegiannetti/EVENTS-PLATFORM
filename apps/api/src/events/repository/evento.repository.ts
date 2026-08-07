import type { TaxaPagaPor } from "@events-platform/shared-types";
import type { EventoModel } from "../model/evento.model";

export const EVENTO_REPOSITORY = Symbol("EVENTO_REPOSITORY");

export interface CriarEventoData {
  nome: string;
  data: Date;
  local: string;
  transferivel: boolean;
  taxaPagaPor: TaxaPagaPor;
}

export type AtualizarEventoData = Partial<CriarEventoData>;

export interface EventoRepository {
  criar(data: CriarEventoData): Promise<EventoModel>;
  buscarPorId(id: string): Promise<EventoModel | null>;
  atualizar(id: string, data: AtualizarEventoData): Promise<EventoModel>;
  listarPorUsuario(usuarioId: string): Promise<EventoModel[]>;
}
