import type { StatusIngresso } from "@events-platform/shared-types";
import type { IngressoModel } from "../model/ingresso.model";

export const INGRESSO_REPOSITORY = Symbol("INGRESSO_REPOSITORY");

export interface CriarIngressoData {
  id: string;
  eventoId: string;
  loteId: string;
  linkVendaId?: string;
  qrToken: string;
  transferivel: boolean;
}

export interface IngressoRepository {
  criar(data: CriarIngressoData): Promise<IngressoModel>;
  buscarPorId(id: string): Promise<IngressoModel | null>;
  atualizarStatus(id: string, status: StatusIngresso): Promise<IngressoModel>;
  listarPorEvento(eventoId: string): Promise<IngressoModel[]>;
}
