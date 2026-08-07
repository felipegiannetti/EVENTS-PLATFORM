import { z } from "zod";
import { PAPEL_EVENTO } from "../enums";

export const papelAcessoResponseSchema = z.object({
  usuarioId: z.string().uuid(),
  eventoId: z.string().uuid(),
  papel: z.enum(PAPEL_EVENTO),
  usuarioNome: z.string(),
  usuarioEmail: z.string().email(),
});
export type PapelAcessoResponse = z.infer<typeof papelAcessoResponseSchema>;
