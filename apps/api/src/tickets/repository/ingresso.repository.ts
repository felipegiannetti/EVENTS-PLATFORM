import type { StatusIngresso } from "@events-platform/shared-types";
import type { IngressoModel } from "../model/ingresso.model";
import type { MeuIngressoModel } from "../model/meu-ingresso.model";

export const INGRESSO_REPOSITORY = Symbol("INGRESSO_REPOSITORY");

export interface CriarIngressoData {
  id: string;
  eventoId: string;
  loteId: string;
  linkVendaId?: string;
  qrToken: string;
  transferivel: boolean;
  compradorNome?: string;
  compradorEmail?: string;
  compradorDocumento?: string;
}

export interface IngressoRepository {
  criar(data: CriarIngressoData): Promise<IngressoModel>;
  buscarPorId(id: string): Promise<IngressoModel | null>;
  atualizarStatus(id: string, status: StatusIngresso): Promise<IngressoModel>;
  listarPorEvento(eventoId: string): Promise<IngressoModel[]>;
  /** Lock otimista via WHERE status='valido' — se outra requisição já fez o check-in nesse meio-tempo (corrida na catraca), retorna false em vez de sobrescrever. */
  marcarComoUsadoSeValido(id: string): Promise<boolean>;
  /** Cross-evento — usado só pela listagem "Meus ingressos" do comprador, feita a partir do email dele. */
  listarPorCompradorEmail(email: string): Promise<MeuIngressoModel[]>;
  /** Emails distintos dos compradores desse evento (ignora ingressos sem comprador) — usado pelo broadcast de email. */
  listarEmailsCompradoresPorEvento(eventoId: string): Promise<string[]>;
}
