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
  cancelamentoFlexivel?: boolean;
  compradorNome?: string;
  compradorEmail?: string;
  compradorDocumento?: string;
  cupomDescontoId?: string;
}

export interface AtualizarCompradorData {
  compradorNome?: string;
  compradorEmail: string;
  compradorDocumento?: string;
}

export interface AceitarTransferenciaData {
  compradorNome: string;
  compradorEmail: string;
  /** Nulo se o destinatário for uma conta Google que ainda não completou o cadastro (sem CPF/CNPJ). */
  compradorDocumento: string | null;
  qrToken: string;
}

export interface IngressoRepository {
  criar(data: CriarIngressoData): Promise<IngressoModel>;
  buscarPorId(id: string): Promise<IngressoModel | null>;
  atualizarStatus(id: string, status: StatusIngresso): Promise<IngressoModel>;
  atualizarComprador(id: string, data: AtualizarCompradorData): Promise<IngressoModel>;
  /** Inicia a transferência (status -> aguardando_aceite) — não move o ingresso ainda, só marca quem precisa aceitar. Só efetiva se ainda pertencer a esse email e estiver 'valido'. */
  iniciarTransferenciaSePertence(id: string, compradorEmailAtual: string, destinatarioEmail: string): Promise<IngressoModel | null>;
  /** Remetente desiste antes do aceite — volta pra 'valido', continua com o remetente. Só efetiva se ele mesmo tiver iniciado (compradorEmail ainda é dele) e ainda estiver 'aguardando_aceite'. */
  cancelarTransferenciaSePertence(id: string, compradorEmailAtual: string): Promise<IngressoModel | null>;
  /** Destinatário aceita — só efetiva se `destinatarioTransferenciaEmail` bater com quem está aceitando e ainda estiver 'aguardando_aceite'. Rotaciona o qrToken junto. */
  aceitarTransferenciaSeDestinatario(id: string, destinatarioEmail: string, data: AceitarTransferenciaData): Promise<IngressoModel | null>;
  /** Destinatário recusa — mesma trava de aceitarTransferenciaSeDestinatario, mas devolve pro remetente em vez de mudar de dono. */
  recusarTransferenciaSeDestinatario(id: string, destinatarioEmail: string): Promise<IngressoModel | null>;
  /** Cancelamento self-service — só efetiva se o ingresso ainda pertencer a esse email e estiver 'valido' (mesmo padrão de proteção contra corrida das transferências acima). */
  cancelarSePertence(id: string, compradorEmailAtual: string): Promise<IngressoModel | null>;
  listarPorEvento(eventoId: string): Promise<IngressoModel[]>;
  /** Lock otimista via WHERE status='valido' — se outra requisição já fez o check-in nesse meio-tempo (corrida na catraca), retorna false em vez de sobrescrever. */
  marcarComoUsadoSeValido(id: string): Promise<boolean>;
  /** Cross-evento — usado só pela listagem "Meus ingressos" do comprador, feita a partir do email dele. */
  listarPorCompradorEmail(email: string): Promise<MeuIngressoModel[]>;
  /** Transferências iniciadas por outra pessoa esperando esse email aceitar — base de "Transferências recebidas". */
  listarTransferenciasPendentesPorDestinatario(email: string): Promise<MeuIngressoModel[]>;
  /** Emails distintos dos compradores desse evento (ignora ingressos sem comprador) — usado pelo broadcast de email. */
  listarEmailsCompradoresPorEvento(eventoId: string): Promise<string[]>;
}
