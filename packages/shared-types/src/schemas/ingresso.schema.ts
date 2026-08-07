import { z } from "zod";
import { STATUS_INGRESSO } from "../enums";

export const emitirIngressoSchema = z.object({
  linkVendaId: z.string().uuid().optional(),
});
export type EmitirIngressoInput = z.infer<typeof emitirIngressoSchema>;

export const ingressoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  loteId: z.string().uuid(),
  linkVendaId: z.string().uuid().nullable(),
  status: z.enum(STATUS_INGRESSO),
  qrToken: z.string(),
  transferivel: z.boolean(),
  criadoEm: z.string().datetime(),
});
export type IngressoResponse = z.infer<typeof ingressoResponseSchema>;
