import type { LoteModel } from "../model/lote.model";

export const LOTE_REPOSITORY = Symbol("LOTE_REPOSITORY");

export interface CriarLoteData {
  eventoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export type AtualizarLoteData = Partial<Omit<CriarLoteData, "eventoId">>;

export interface LoteRepository {
  criar(data: CriarLoteData): Promise<LoteModel>;
  buscarPorId(id: string): Promise<LoteModel | null>;
  atualizar(id: string, data: AtualizarLoteData): Promise<LoteModel>;
  listarPorEvento(eventoId: string): Promise<LoteModel[]>;
}
