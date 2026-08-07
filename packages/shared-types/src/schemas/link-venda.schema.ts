import { z } from "zod";

export const criarLinkVendaSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "use apenas letras minúsculas, números e hífen"),
  origem: z.string().min(2).max(120),
});
export type CriarLinkVendaInput = z.infer<typeof criarLinkVendaSchema>;

export const linkVendaResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  slug: z.string(),
  origem: z.string(),
});
export type LinkVendaResponse = z.infer<typeof linkVendaResponseSchema>;
