import { z } from "zod";
import { CATEGORIA_EVENTO, PAPEL_EVENTO, TAXA_PAGA_POR } from "../enums";

export const criarEventoSchema = z.object({
  nome: z.string().min(2).max(160),
  data: z.string().datetime(),
  cidade: z.string().min(2).max(100),
  estado: z.string().min(2).max(100),
  pais: z.string().min(2).max(100),
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
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  pais: z.string().nullable(),
  categoria: z.enum(CATEGORIA_EVENTO),
  transferivel: z.boolean(),
  taxaPagaPor: z.enum(TAXA_PAGA_POR),
  criadoEm: z.string().datetime(),
});
export type EventoResponse = z.infer<typeof eventoResponseSchema>;

export function formatarLocalizacaoEvento(
  evento: Pick<EventoResponse, "cidade" | "estado" | "pais">,
): string {
  const partes = [evento.cidade, evento.estado, evento.pais].filter(
    (parte): parte is string => Boolean(parte?.trim()),
  );
  return partes.length > 0 ? partes.join(", ") : "Localização não informada";
}

export const convidarAcessoSchema = z.object({
  usuarioEmail: z.string().email(),
  papel: z.enum(PAPEL_EVENTO).exclude(["owner"]),
});
export type ConvidarAcessoInput = z.infer<typeof convidarAcessoSchema>;
