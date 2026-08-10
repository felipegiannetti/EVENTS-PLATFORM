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
});
export type EmitirIngressoInput = z.infer<typeof emitirIngressoSchema>;

/** Editar um ingresso já emitido — só os dados do comprador (nome/email/documento). Cupom, reenvio de email e cancelamento são ações separadas, não passam por aqui. */
export const atualizarIngressoSchema = emitirIngressoSchema.omit({ linkVendaId: true, cupomDescontoId: true });
export type AtualizarIngressoInput = z.infer<typeof atualizarIngressoSchema>;

export const ingressoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  loteId: z.string().uuid(),
  linkVendaId: z.string().uuid().nullable(),
  status: z.enum(STATUS_INGRESSO),
  qrToken: z.string(),
  transferivel: z.boolean(),
  compradorNome: z.string().nullable(),
  compradorEmail: z.string().nullable(),
  compradorDocumento: z.string().nullable(),
  /** Código do cupom usado nesta emissão (join com CupomDesconto), ou null se nenhum foi usado. */
  cupomCodigo: z.string().nullable(),
  criadoEm: z.string().datetime(),
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

/** O organizador só escreve o corpo — assunto e cabeçalho/rodapé (evento + data + "enviado pelo organizador") são fixos no backend, ver TicketsService.enviarEmailParticipantes. */
export const enviarEmailParticipantesSchema = z.object({
  mensagem: z.string().min(1).max(5000),
});
export type EnviarEmailParticipantesInput = z.infer<typeof enviarEmailParticipantesSchema>;
