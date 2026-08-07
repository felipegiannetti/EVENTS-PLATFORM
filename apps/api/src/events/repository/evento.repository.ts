import type { CategoriaEvento, TaxaPagaPor } from "@events-platform/shared-types";
import type { EventoModel } from "../model/evento.model";

export const EVENTO_REPOSITORY = Symbol("EVENTO_REPOSITORY");

export interface CriarEventoData {
  nome: string;
  data: Date;
  cidade: string;
  estado: string;
  pais: string;
  categoria: CategoriaEvento;
  transferivel: boolean;
  taxaPagaPor: TaxaPagaPor;
}

export type AtualizarEventoData = Partial<CriarEventoData>;

export interface EventoRepository {
  criar(data: CriarEventoData): Promise<EventoModel>;
  buscarPorId(id: string): Promise<EventoModel | null>;
  atualizar(id: string, data: AtualizarEventoData): Promise<EventoModel>;
  listarPorUsuario(usuarioId: string): Promise<EventoModel[]>;
  listarPublicos(): Promise<EventoModel[]>;
}
