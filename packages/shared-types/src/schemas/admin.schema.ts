import { z } from "zod";
import { ESCOPO_ACORDO_COMERCIAL } from "../enums";

export const criarAcordoComercialSchema = z.object({
  organizadorId: z.string().uuid(),
  eventoId: z.string().uuid().optional(),
  percentualOrganizador: z.number().min(0).max(4),
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
  indicadorNome: z.string().nullable(),
  indicadorEmail: z.string().email().nullable(),
  percentualIndicador: z.number(),
  eventos: z.array(z.object({ id: z.string().uuid(), nome: z.string(), data: z.string().datetime() })),
  acordos: z.array(acordoComercialResponseSchema),
});
export type OrganizadorAdminResponse = z.infer<typeof organizadorAdminResponseSchema>;

/** Espaço de Suporte — busca de evento de qualquer organizador (modo leitura, ver EventRoleGuard). */
export const eventoAdminResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  organizadorNome: z.string().nullable(),
  organizadorEmail: z.string().email().nullable(),
  data: z.string().datetime(),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  publicado: z.boolean(),
});
export type EventoAdminResponse = z.infer<typeof eventoAdminResponseSchema>;

/** Espaço de Sistema — registro de funcionalidades ligáveis/desligáveis. Nenhuma delas é checada por código ainda (ver docs/architecture/11-roadmap.md); é só o CRUD/estado. */
export const criarFeatureFlagSchema = z.object({
  chave: z.string().min(2).max(80),
});
export type CriarFeatureFlagInput = z.infer<typeof criarFeatureFlagSchema>;

export const featureFlagResponseSchema = z.object({
  id: z.string().uuid(),
  chave: z.string(),
  ativo: z.boolean(),
  eventosEscopo: z.array(z.string()),
  criadoEm: z.string().datetime(),
});
export type FeatureFlagResponse = z.infer<typeof featureFlagResponseSchema>;

/**
 * Espaço Financeiro do admin — consolidado entre todos os eventos, reaproveitando o mesmo cálculo
 * de ResumoFinanceiroEvento por evento (não existe Transacao real hoje, ver resumo-financeiro.schema.ts).
 */
export const financeiroAdminEventoResponseSchema = z.object({
  eventoId: z.string().uuid(),
  eventoNome: z.string(),
  organizadorNome: z.string().nullable(),
  data: z.string().datetime(),
  vendasBrutas: z.number(),
  taxaRetidaPlataforma: z.number(),
  valorRepasseOrganizador: z.number(),
  ingressosValidos: z.number().int(),
});
export type FinanceiroAdminEventoResponse = z.infer<typeof financeiroAdminEventoResponseSchema>;

export const financeiroAdminResponseSchema = z.object({
  totais: z.object({
    vendasBrutas: z.number(),
    taxaRetidaPlataforma: z.number(),
    valorRepasseOrganizador: z.number(),
    totalEventos: z.number().int(),
    totalIngressosValidos: z.number().int(),
  }),
  eventos: z.array(financeiroAdminEventoResponseSchema),
});
export type FinanceiroAdminResponse = z.infer<typeof financeiroAdminResponseSchema>;

/** Visão de auditoria — só leitura, mais recentes primeiro (GET /admin/auditoria). */
export const auditLogResponseSchema = z.object({
  id: z.string().uuid(),
  acao: z.string(),
  entidade: z.string(),
  entidadeId: z.string(),
  /** Nulo quando o autor excluiu a própria conta depois (AuditLog.usuario é SetNull). */
  autorNome: z.string().nullable(),
  autorEmail: z.string().nullable(),
  ip: z.string().nullable(),
  criadoEm: z.string().datetime(),
});
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;
