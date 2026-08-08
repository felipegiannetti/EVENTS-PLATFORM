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
  })
  .refine((dados) => dados.tipo !== "percentual" || dados.valor <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["valor"],
  });
export type CriarCupomDescontoInput = z.infer<typeof criarCupomDescontoSchema>;

export const atualizarCupomDescontoSchema = z.object({
  ativo: z.boolean(),
});
export type AtualizarCupomDescontoInput = z.infer<typeof atualizarCupomDescontoSchema>;

export const cupomDescontoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  codigo: z.string(),
  tipo: z.enum(TIPO_DESCONTO_CUPOM),
  valor: z.number(),
  ativo: z.boolean(),
  /** Sempre 0 até existir checkout self-service — sem compra de verdade não tem como um cupom ter sido "usado". */
  usos: z.number().int(),
  criadoEm: z.string().datetime(),
});
export type CupomDescontoResponse = z.infer<typeof cupomDescontoResponseSchema>;

export function formatarDescontoCupom(cupom: Pick<CupomDescontoResponse, "tipo" | "valor">): string {
  return cupom.tipo === "percentual" ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`;
}
