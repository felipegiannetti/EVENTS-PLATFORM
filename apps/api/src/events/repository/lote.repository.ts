import type { LoteModel } from "../model/lote.model";

export const LOTE_REPOSITORY = Symbol("LOTE_REPOSITORY");

export interface CriarLoteData {
  eventoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  especial?: boolean;
}

export type AtualizarLoteData = Partial<Omit<CriarLoteData, "eventoId">>;

export interface LoteRepository {
  criar(data: CriarLoteData): Promise<LoteModel>;
  buscarPorId(id: string): Promise<LoteModel | null>;
  atualizar(id: string, data: AtualizarLoteData): Promise<LoteModel>;
  listarPorEvento(eventoId: string): Promise<LoteModel[]>;
  /**
   * Reserva atômica de UMA vaga já como ingresso emitido (fluxo direto, sem reserva prévia) —
   * `UPDATE ... WHERE quantidadeEmitida + vagasReservadas < quantidade`, uma única instrução SQL,
   * então duas emissões concorrentes pro mesmo lote nunca conseguem "passar" as duas na mesma vaga
   * (a segunda simplesmente não afeta nenhuma linha). Retorna false se não havia vaga disponível.
   */
  ocuparVagaEmitidaSeDisponivel(loteId: string): Promise<boolean>;
  /** Desfaz ocuparVagaEmitidaSeDisponivel — usado quando um passo seguinte da emissão falha (ex: cupom esgotado) e a vaga precisa voltar. */
  liberarVagaEmitida(loteId: string): Promise<void>;
  /** Mesma atomicidade de ocuparVagaEmitidaSeDisponivel, mas incrementando vagasReservadas (ReservaIngresso) em vez de quantidadeEmitida. */
  ocuparVagaReservadaSeDisponivel(loteId: string): Promise<boolean>;
  /** Converte uma vaga reservada em emitida (confirmação de reserva) — não precisa checar capacidade de novo, a vaga já estava garantida. */
  confirmarVagaReservada(loteId: string): Promise<void>;
  /** Libera uma vaga reservada sem confirmar (expiração ou cancelamento da reserva). */
  liberarVagaReservada(loteId: string): Promise<void>;
}
