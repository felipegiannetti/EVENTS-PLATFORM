import { z } from "zod";
import { TIPO_DESCONTO_CUPOM } from "../enums";

export const criarCupomDescontoSchema = z
  .object({
    codigo: z
      .string()
      .min(2)
      .max(30)
      .transform((valor) => valor.trim().toUpperCase()),
    tipo: z.enum(TIPO_DESCONTO_CUPOM),
    valor: z.number().positive(),
    /** Vazio/ausente = ilimitado (padrão). */
    limiteUsos: z.number().int().positive().optional(),
  })
  .refine((dados) => dados.tipo !== "percentual" || dados.valor <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["valor"],
  });
export type CriarCupomDescontoInput = z.infer<typeof criarCupomDescontoSchema>;

/** Edição completa — substitui todos os campos editáveis do cupom de uma vez (mesmo padrão de AtualizarLoteDto). */
export const atualizarCupomDescontoSchema = z
  .object({
    codigo: z
      .string()
      .min(2)
      .max(30)
      .transform((valor) => valor.trim().toUpperCase()),
    tipo: z.enum(TIPO_DESCONTO_CUPOM),
    valor: z.number().positive(),
    limiteUsos: z.number().int().positive().optional(),
    ativo: z.boolean(),
  })
  .refine((dados) => dados.tipo !== "percentual" || dados.valor <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["valor"],
  });
export type AtualizarCupomDescontoInput = z.infer<typeof atualizarCupomDescontoSchema>;

export const cupomDescontoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  codigo: z.string(),
  tipo: z.enum(TIPO_DESCONTO_CUPOM),
  valor: z.number(),
  ativo: z.boolean(),
  /** null = ilimitado. Quando setado, emissão é bloqueada assim que usos >= limiteUsos. */
  limiteUsos: z.number().int().nullable(),
  /** Incrementado na emissão manual que marcar esse cupom como usado (ver Ingresso.cupomDescontoId) — não conta vendas via checkout self-service, que ainda não existe. */
  usos: z.number().int(),
  criadoEm: z.string().datetime(),
});
export type CupomDescontoResponse = z.infer<typeof cupomDescontoResponseSchema>;

export function formatarDescontoCupom(cupom: Pick<CupomDescontoResponse, "tipo" | "valor">): string {
  return cupom.tipo === "percentual" ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`;
}
