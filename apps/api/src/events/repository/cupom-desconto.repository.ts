import type { TipoDescontoCupom } from "@events-platform/shared-types";
import type { CupomDescontoModel } from "../model/cupom-desconto.model";

export const CUPOM_DESCONTO_REPOSITORY = Symbol("CUPOM_DESCONTO_REPOSITORY");

export interface CriarCupomDescontoData {
  eventoId: string;
  codigo: string;
  tipo: TipoDescontoCupom;
  valor: number;
  limiteUsos?: number;
  especial?: boolean;
  /** Hash já pronto (argon2) — o Repository nunca vê a senha em texto puro, isso é responsabilidade do Service. */
  senhaHash?: string;
}

/** Edição completa — substitui todos os campos editáveis de uma vez (mesmo padrão de AtualizarLoteData). */
export interface AtualizarCupomDescontoData {
  codigo: string;
  tipo: TipoDescontoCupom;
  valor: number;
  limiteUsos?: number;
  ativo: boolean;
  especial?: boolean;
  /** Ausente = mantém o hash já salvo (não altera a senha). */
  senhaHash?: string;
}

export interface CupomDescontoRepository {
  criar(data: CriarCupomDescontoData): Promise<CupomDescontoModel>;
  buscarPorId(id: string): Promise<CupomDescontoModel | null>;
  listarPorEvento(eventoId: string): Promise<CupomDescontoModel[]>;
  atualizar(id: string, data: AtualizarCupomDescontoData): Promise<CupomDescontoModel>;
  remover(id: string): Promise<void>;
  /** Chamado quando um ingresso é emitido/cancelado marcando esse cupom como usado — ver Ingresso.cupomDescontoId. */
  incrementarUsos(id: string): Promise<void>;
  decrementarUsos(id: string): Promise<void>;
}
