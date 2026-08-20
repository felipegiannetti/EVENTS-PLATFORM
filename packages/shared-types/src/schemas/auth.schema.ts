import { z } from "zod";
import { TIPO_PESSOA } from "../enums";
import { validarCnpj, validarCpf } from "../validators/documento";
import { MENSAGEM_SENHA_FRACA, senhaEhForte } from "../validators/senha";

/**
 * Pessoa física precisa de CPF + data de nascimento; pessoa jurídica precisa de CNPJ (sem data
 * de nascimento — empresa não tem). Documento validado por dígito verificador real, não só
 * tamanho — mesmo racional de conta-bancaria.schema.ts, pra não deixar cadastrar com CPF/CNPJ
 * digitado errado.
 */
export const registerSchema = z
  .object({
    nome: z.string().min(2).max(160),
    email: z.string().email(),
    senha: z.string().min(8).max(72).refine(senhaEhForte, { message: MENSAGEM_SENHA_FRACA }),
    tipoPessoa: z.enum(TIPO_PESSOA),
    documento: z.string().min(11).max(18),
    dataNascimento: z.string().date().optional(),
    /** Obrigatório — usado pelo organizador de eventos pra contato com participantes/suporte. */
    telefone: z.string().min(10).max(20),
    codigoIndicacao: z.string().trim().min(8).max(64).optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.tipoPessoa === "fisica") {
      if (!validarCpf(dados.documento)) {
        ctx.addIssue({ code: "custom", path: ["documento"], message: "CPF inválido (dígito verificador não confere)" });
      }
      if (!dados.dataNascimento) {
        ctx.addIssue({ code: "custom", path: ["dataNascimento"], message: "Data de nascimento é obrigatória para pessoa física" });
      }
    } else {
      if (!validarCnpj(dados.documento)) {
        ctx.addIssue({ code: "custom", path: ["documento"], message: "CNPJ inválido (dígito verificador não confere)" });
      }
    }
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiraEm: z.string().datetime(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const confirmarEmailSchema = z.object({ token: z.string().min(32) });
export type ConfirmarEmailInput = z.infer<typeof confirmarEmailSchema>;

export const reenviarConfirmacaoEmailResponseSchema = z.object({ mensagem: z.string() });
export type ReenviarConfirmacaoEmailResponse = z.infer<typeof reenviarConfirmacaoEmailResponseSchema>;

/** Exclusão self-service de conta sem senha (Google) — confirmação por email em vez de senha atual. */
export const confirmarExclusaoContaSchema = z.object({ token: z.string().min(32) });
export type ConfirmarExclusaoContaInput = z.infer<typeof confirmarExclusaoContaSchema>;
