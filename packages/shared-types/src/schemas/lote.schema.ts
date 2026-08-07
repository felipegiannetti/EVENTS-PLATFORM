import { z } from "zod";

export const criarLoteSchema = z.object({
  nome: z.string().min(2).max(120),
  preco: z.number().nonnegative(),
  quantidade: z.number().int().positive(),
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
});
export type LoteResponse = z.infer<typeof loteResponseSchema>;
