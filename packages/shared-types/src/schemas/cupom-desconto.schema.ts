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
    /** Vazio/ausente = ilimitado (padrão). */
    limiteUsos: z.number().int().positive().optional(),
    /** Cupom especial (protegido por senha) — dá acesso a lotes especiais (ver Lote.especial). */
    especial: z.boolean().default(false),
    /** Obrigatória quando especial=true — nunca guardada em texto puro, só o hash (ver senhaHash no schema Prisma). */
    senha: z.string().min(4).max(72).optional(),
  })
  .refine((dados) => dados.tipo !== "percentual" || dados.valor <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["valor"],
  })
  .refine((dados) => !dados.especial || Boolean(dados.senha), {
    message: "Cupom especial exige uma senha",
    path: ["senha"],
  });
export type CriarCupomDescontoInput = z.infer<typeof criarCupomDescontoSchema>;

/** Edição completa — substitui todos os campos editáveis do cupom de uma vez (mesmo padrão de AtualizarLoteDto). */
export const atualizarCupomDescontoSchema = z
  .object({
    codigo: z
      .string()
      .min(2)
      .max(30)
      .transform((valor) => valor.trim().toUpperCase()),
    tipo: z.enum(TIPO_DESCONTO_CUPOM),
    valor: z.number().positive(),
    limiteUsos: z.number().int().positive().optional(),
    ativo: z.boolean(),
    especial: z.boolean().default(false),
    /** Vazia/ausente = mantém a senha atual (se já era especial). Preenchida = troca a senha. */
    senha: z.string().min(4).max(72).optional(),
  })
  .refine((dados) => dados.tipo !== "percentual" || dados.valor <= 100, {
    message: "Desconto percentual não pode passar de 100%",
    path: ["valor"],
  });
export type AtualizarCupomDescontoInput = z.infer<typeof atualizarCupomDescontoSchema>;

export const cupomDescontoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  codigo: z.string(),
  tipo: z.enum(TIPO_DESCONTO_CUPOM),
  valor: z.number(),
  ativo: z.boolean(),
  /** null = ilimitado. Quando setado, emissão é bloqueada assim que usos >= limiteUsos. */
  limiteUsos: z.number().int().nullable(),
  /** Incrementado na emissão manual que marcar esse cupom como usado (ver Ingresso.cupomDescontoId) — não conta vendas via checkout self-service, que ainda não existe. */
  usos: z.number().int(),
  /** Cupom protegido por senha — nunca expõe a senha/hash em nenhuma resposta, ver desbloquearCupomSchema. */
  especial: z.boolean(),
  criadoEm: z.string().datetime(),
});
export type CupomDescontoResponse = z.infer<typeof cupomDescontoResponseSchema>;

/** Corpo do endpoint público de desbloqueio de um cupom especial (POST /events/public/:id/cupom/:codigo/desbloquear). */
export const desbloquearCupomSchema = z.object({
  senha: z.string().min(1),
});
export type DesbloquearCupomInput = z.infer<typeof desbloquearCupomSchema>;

/**
 * Resposta de GET /events/public/:id/cupom/:codigo. Cupom normal: tipo/valor já vêm preenchidos
 * (a validação em si já revela o desconto, como sempre foi). Cupom especial ainda não desbloqueado:
 * só `especial: true` — tipo/valor ficam ausentes até a senha ser confirmada em
 * POST /events/public/:id/cupom/:codigo/desbloquear, que devolve essa mesma forma já com tipo/valor.
 */
export const cupomValidacaoPublicaResponseSchema = z.object({
  codigo: z.string(),
  especial: z.boolean(),
  tipo: z.enum(TIPO_DESCONTO_CUPOM).optional(),
  valor: z.number().optional(),
});
export type CupomValidacaoPublicaResponse = z.infer<typeof cupomValidacaoPublicaResponseSchema>;

export function formatarDescontoCupom(cupom: Pick<CupomDescontoResponse, "tipo" | "valor">): string {
  return cupom.tipo === "percentual" ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`;
}
