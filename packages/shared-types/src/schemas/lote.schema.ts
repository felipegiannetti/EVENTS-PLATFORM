import { z } from "zod";

export const criarLoteSchema = z.object({
  nome: z.string().min(2).max(120),
  preco: z.number().nonnegative(),
  quantidade: z.number().int().positive(),
  /** Lote especial/privado — pensado pra só ficar acessível através de um cupom especial protegido por senha. */
  especial: z.boolean().default(false),
  oculto: z.boolean().default(false),
});
export type CriarLoteInput = z.infer<typeof criarLoteSchema>;

export const atualizarLoteSchema = criarLoteSchema.partial();
export type AtualizarLoteInput = z.infer<typeof atualizarLoteSchema>;

export const loteResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  nome: z.string(),
  preco: z.number(),
  quantidade: z.number().int(),
  quantidadeEmitida: z.number().int(),
  especial: z.boolean(),
  oculto: z.boolean(),
});
export type LoteResponse = z.infer<typeof loteResponseSchema>;
