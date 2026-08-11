import { z } from "zod";
import { cadastrarContaBancariaSchema } from "./conta-bancaria.schema";

export const criarProgramaIndicacaoSchema = cadastrarContaBancariaSchema;
export type CriarProgramaIndicacaoInput = z.infer<typeof criarProgramaIndicacaoSchema>;

export const criarOfertaIndicacaoSchema = z.object({
  percentualBeneficioOrganizador: z.number().min(0).max(2),
});
export type CriarOfertaIndicacaoInput = z.infer<typeof criarOfertaIndicacaoSchema>;

export const ofertaIndicacaoResponseSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  percentualBeneficioOrganizador: z.number(),
  ativo: z.boolean(),
  utilizado: z.boolean(),
  totalUtilizacoes: z.number().int().nonnegative(),
  criadoEm: z.string().datetime(),
});
export type OfertaIndicacaoResponse = z.infer<typeof ofertaIndicacaoResponseSchema>;

export const programaIndicacaoResponseSchema = z.object({
  id: z.string().uuid(),
  banco: z.string(),
  contaFinal: z.string(),
  tipoConta: z.enum(["corrente", "poupanca"]),
  titular: z.string(),
  ativo: z.boolean(),
  ofertas: z.array(ofertaIndicacaoResponseSchema),
});
export type ProgramaIndicacaoResponse = z.infer<typeof programaIndicacaoResponseSchema>;

export const eventoComissaoIndicacaoSchema = z.object({
  eventoId: z.string().uuid(),
  eventoNome: z.string(),
  organizadorNome: z.string(),
  percentualBase: z.number(),
  percentualBonus: z.number(),
  percentualTotal: z.number(),
  percentualBeneficioOrganizador: z.number(),
  baseCalculo: z.number(),
  valorEstimado: z.number(),
});
export type EventoComissaoIndicacao = z.infer<typeof eventoComissaoIndicacaoSchema>;

export const painelIndicacaoResponseSchema = z.object({
  programa: programaIndicacaoResponseSchema.nullable(),
  confirmacaoContaPendente: z.boolean(),
  totalIndicados: z.number().int(),
  totalEventosPagos: z.number().int(),
  totalEstimado: z.number(),
  eventos: z.array(eventoComissaoIndicacaoSchema),
});
export type PainelIndicacaoResponse = z.infer<typeof painelIndicacaoResponseSchema>;

export const solicitarConfirmacaoContaIndicacaoResponseSchema = z.object({
  mensagem: z.string(),
  emailMascarado: z.string(),
});
export type SolicitarConfirmacaoContaIndicacaoResponse = z.infer<typeof solicitarConfirmacaoContaIndicacaoResponseSchema>;

export const confirmarContaIndicacaoSchema = z.object({ token: z.string().min(32) });
export type ConfirmarContaIndicacaoInput = z.infer<typeof confirmarContaIndicacaoSchema>;

export const confirmarContaIndicacaoResponseSchema = z.object({ confirmado: z.literal(true) });
export type ConfirmarContaIndicacaoResponse = z.infer<typeof confirmarContaIndicacaoResponseSchema>;

export const ofertaIndicacaoPublicaResponseSchema = z.object({
  indicadorNome: z.string(),
  percentualBeneficioOrganizador: z.number(),
});
export type OfertaIndicacaoPublicaResponse = z.infer<typeof ofertaIndicacaoPublicaResponseSchema>;
