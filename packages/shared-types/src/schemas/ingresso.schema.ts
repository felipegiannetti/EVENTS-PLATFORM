import { z } from "zod";
import { STATUS_INGRESSO } from "../enums";

export const emitirIngressoSchema = z.object({
  linkVendaId: z.string().uuid().optional(),
  /** Email é obrigatório — é o que liga esse ingresso ao "Meus ingressos" do Usuario dono desse email, e sem ele o ingresso emitido não aparece pra ninguém depois. Nome/documento continuam opcionais. */
  compradorNome: z.string().max(160).optional(),
  compradorEmail: z.string().email(),
  compradorDocumento: z.string().max(20).optional(),
  /** Opcional — marca que esse ingresso usou um cupom de desconto (incrementa CupomDesconto.usos). Só na emissão, não dá pra mudar depois via atualizarIngressoSchema. */
  cupomDescontoId: z.string().uuid().optional(),
  /** Cancelamento flexível — comprador pode cancelar a qualquer momento até perto do evento, em vez da janela padrão de 7 dias. Ver docs/architecture/12-pagamentos-e-repasses.md#43 (sem cobrança real do adicional de 10%, não existe checkout). */
  cancelamentoFlexivel: z.boolean().default(false),
});
export type EmitirIngressoInput = z.infer<typeof emitirIngressoSchema>;

/** Editar um ingresso já emitido — só os dados do comprador (nome/email/documento). Cupom, reenvio de email e cancelamento são ações separadas, não passam por aqui. */
export const atualizarIngressoSchema = emitirIngressoSchema.omit({ linkVendaId: true, cupomDescontoId: true, cancelamentoFlexivel: true });
export type AtualizarIngressoInput = z.infer<typeof atualizarIngressoSchema>;

export const ingressoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  loteId: z.string().uuid(),
  linkVendaId: z.string().uuid().nullable(),
  status: z.enum(STATUS_INGRESSO),
  qrToken: z.string(),
  transferivel: z.boolean(),
  cancelamentoFlexivel: z.boolean(),
  compradorNome: z.string().nullable(),
  compradorEmail: z.string().nullable(),
  compradorDocumento: z.string().nullable(),
  /** Preenchido só quando status='aguardando_aceite' — o email de quem precisa aceitar a transferência. */
  destinatarioTransferenciaEmail: z.string().nullable(),
  /** Código do cupom usado nesta emissão (join com CupomDesconto), ou null se nenhum foi usado. */
  cupomCodigo: z.string().nullable(),
  criadoEm: z.string().datetime(),
  usadoEm: z.string().datetime().nullable(),
});
export type IngressoResponse = z.infer<typeof ingressoResponseSchema>;

export const meuIngressoResponseSchema = ingressoResponseSchema.extend({
  eventoNome: z.string(),
  eventoData: z.string().datetime(),
  loteNome: z.string(),
});
export type MeuIngressoResponse = z.infer<typeof meuIngressoResponseSchema>;

export const transferirIngressoSchema = z.object({
  destinatarioEmail: z.string().trim().email(),
});
export type TransferirIngressoInput = z.infer<typeof transferirIngressoSchema>;

export const checkinSchema = z.object({
  qrToken: z.string().min(1),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

export const leituraCheckinResponseSchema = z.object({
  ingressoId: z.string().uuid(),
  compradorNome: z.string().nullable(),
  compradorEmail: z.string().nullable(),
  usadoEm: z.string().datetime(),
});
export type LeituraCheckinResponse = z.infer<typeof leituraCheckinResponseSchema>;

/** O organizador só escreve o corpo — assunto e cabeçalho/rodapé (evento + data + "enviado pelo organizador") são fixos no backend, ver TicketsService.enviarEmailParticipantes. */
export const enviarEmailParticipantesSchema = z.object({
  mensagem: z.string().min(1).max(5000),
});
export type EnviarEmailParticipantesInput = z.infer<typeof enviarEmailParticipantesSchema>;

/** Política da plataforma: cancelamento self-service em até 7 dias corridos da emissão/compra (direito de arrependimento, análogo ao art. 49 do CDC) — ver docs/architecture/12-pagamentos-e-repasses.md#42. Ingressos com cancelamentoFlexivel=true não têm esse limite (podem cancelar até perto do evento). */
export const PRAZO_CANCELAMENTO_PADRAO_DIAS = 7;

/** Mesma regra usada no front (pra habilitar/desabilitar o botão) e no back (fonte da verdade, sempre revalidada lá). */
export function podeCancelarSelfService(ingresso: {
  status: string;
  criadoEm: string;
  cancelamentoFlexivel: boolean;
  eventoData: string;
}): boolean {
  if (ingresso.status !== "valido") return false;
  const agora = Date.now();
  if (new Date(ingresso.eventoData).getTime() <= agora) return false;
  if (ingresso.cancelamentoFlexivel) return true;
  const prazoMs = PRAZO_CANCELAMENTO_PADRAO_DIAS * 24 * 60 * 60 * 1000;
  return agora - new Date(ingresso.criadoEm).getTime() <= prazoMs;
}
