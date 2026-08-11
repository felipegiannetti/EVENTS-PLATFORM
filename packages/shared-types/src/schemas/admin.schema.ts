import { z } from "zod";
import { ESCOPO_ACORDO_COMERCIAL } from "../enums";

export const criarAcordoComercialSchema = z.object({
  organizadorId: z.string().uuid(),
  eventoId: z.string().uuid().optional(),
  percentualOrganizador: z.number().min(0).max(12),
  escopo: z.enum(ESCOPO_ACORDO_COMERCIAL),
  eventosRestantes: z.number().int().positive().optional(),
}).superRefine((dados, ctx) => {
  if (dados.escopo === "evento_especifico" && !dados.eventoId) {
    ctx.addIssue({ code: "custom", path: ["eventoId"], message: "Selecione o evento específico" });
  }
  if (dados.escopo === "proximos_n_eventos" && !dados.eventosRestantes) {
    ctx.addIssue({ code: "custom", path: ["eventosRestantes"], message: "Informe quantos eventos receberão o acordo" });
  }
});
export type CriarAcordoComercialInput = z.infer<typeof criarAcordoComercialSchema>;

export const acordoComercialResponseSchema = z.object({
  id: z.string().uuid(),
  organizadorId: z.string().uuid(),
  eventoId: z.string().uuid().nullable(),
  percentualOrganizador: z.number(),
  percentualNovyx: z.number(),
  escopo: z.enum(ESCOPO_ACORDO_COMERCIAL),
  eventosRestantes: z.number().int().nullable(),
  ativo: z.boolean(),
  criadoEm: z.string().datetime(),
});
export type AcordoComercialResponse = z.infer<typeof acordoComercialResponseSchema>;

export const organizadorAdminResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  indicado: z.boolean(),
  percentualBeneficioIndicacao: z.number(),
  eventos: z.array(z.object({ id: z.string().uuid(), nome: z.string(), data: z.string().datetime() })),
  acordos: z.array(acordoComercialResponseSchema),
});
export type OrganizadorAdminResponse = z.infer<typeof organizadorAdminResponseSchema>;
