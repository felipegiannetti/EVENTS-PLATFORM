import { z } from "zod";
import { CATEGORIA_EVENTO, PAPEL_EVENTO, TAXA_PAGA_POR } from "../enums";

export const criarEventoSchema = z.object({
  nome: z.string().min(2).max(160),
  data: z.string().datetime(),
  local: z.string().min(2).max(200),
  categoria: z.enum(CATEGORIA_EVENTO),
  transferivel: z.boolean().default(false),
  taxaPagaPor: z.enum(TAXA_PAGA_POR).default("comprador"),
});
export type CriarEventoInput = z.infer<typeof criarEventoSchema>;

export const atualizarEventoSchema = criarEventoSchema.partial();
export type AtualizarEventoInput = z.infer<typeof atualizarEventoSchema>;

export const eventoResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  data: z.string().datetime(),
  local: z.string(),
  categoria: z.enum(CATEGORIA_EVENTO),
  transferivel: z.boolean(),
  taxaPagaPor: z.enum(TAXA_PAGA_POR),
  criadoEm: z.string().datetime(),
});
export type EventoResponse = z.infer<typeof eventoResponseSchema>;

export const convidarAcessoSchema = z.object({
  usuarioEmail: z.string().email(),
  papel: z.enum(PAPEL_EVENTO).exclude(["owner"]),
});
export type ConvidarAcessoInput = z.infer<typeof convidarAcessoSchema>;
