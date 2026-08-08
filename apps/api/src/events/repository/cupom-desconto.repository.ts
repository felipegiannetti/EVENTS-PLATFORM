import type { TipoDescontoCupom } from "@events-platform/shared-types";
import type { CupomDescontoModel } from "../model/cupom-desconto.model";

export const CUPOM_DESCONTO_REPOSITORY = Symbol("CUPOM_DESCONTO_REPOSITORY");

export interface CriarCupomDescontoData {
  eventoId: string;
  codigo: string;
  tipo: TipoDescontoCupom;
  valor: number;
}

export interface CupomDescontoRepository {
  criar(data: CriarCupomDescontoData): Promise<CupomDescontoModel>;
  buscarPorId(id: string): Promise<CupomDescontoModel | null>;
  listarPorEvento(eventoId: string): Promise<CupomDescontoModel[]>;
  atualizarAtivo(id: string, ativo: boolean): Promise<CupomDescontoModel>;
  remover(id: string): Promise<void>;
}
