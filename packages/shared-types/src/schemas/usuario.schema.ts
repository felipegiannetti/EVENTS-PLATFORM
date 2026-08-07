import { z } from "zod";
import { PAPEL_GLOBAL } from "../enums";

export const usuarioResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  papelGlobal: z.enum(PAPEL_GLOBAL),
  criadoEm: z.string().datetime(),
});
export type UsuarioResponse = z.infer<typeof usuarioResponseSchema>;
