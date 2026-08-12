import { z } from "zod";

/**
 * Infraestrutura para quando existir checkout self-service — ver docs/architecture/11-roadmap.md.
 * Reserva segura uma vaga do lote por até PRAZO_RESERVA_MINUTOS enquanto o comprador finaliza a
 * compra; se não confirmar a tempo, a vaga é liberada automaticamente (expiração lazy, ver
 * TicketsService.expirarReservasVencidas). Sem UI própria ainda — só os endpoints.
 */
export const PRAZO_RESERVA_MINUTOS = 15;

export const STATUS_RESERVA = ["ativa", "confirmada", "expirada", "cancelada"] as const;
export type StatusReserva = (typeof STATUS_RESERVA)[number];

export const criarReservaSchema = z.object({
  /** Opcional — só informativo até a confirmação (que já exige email de verdade). */
  compradorEmail: z.string().email().optional(),
  /** Opcionais — usados no relatório de carrinho abandonado do organizador se a reserva nunca virar ingresso. */
  compradorNome: z.string().max(160).optional(),
  compradorTelefone: z.string().max(30).optional(),
});
export type CriarReservaInput = z.infer<typeof criarReservaSchema>;

export const reservaResponseSchema = z.object({
  id: z.string().uuid(),
  loteId: z.string().uuid(),
  status: z.enum(STATUS_RESERVA),
  expiraEm: z.string().datetime(),
  compradorEmail: z.string().nullable(),
  compradorNome: z.string().nullable(),
  compradorTelefone: z.string().nullable(),
  criadoEm: z.string().datetime(),
});
export type ReservaResponse = z.infer<typeof reservaResponseSchema>;

/** Reserva que expirou (ou passou do prazo) sem virar ingresso — base do relatório de carrinho abandonado. */
export const carrinhoAbandonadoResponseSchema = z.object({
  id: z.string().uuid(),
  loteNome: z.string(),
  compradorNome: z.string().nullable(),
  compradorEmail: z.string().nullable(),
  compradorTelefone: z.string().nullable(),
  criadoEm: z.string().datetime(),
  expiraEm: z.string().datetime(),
});
export type CarrinhoAbandonadoResponse = z.infer<typeof carrinhoAbandonadoResponseSchema>;
