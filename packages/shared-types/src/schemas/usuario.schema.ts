import { z } from "zod";
import { PAPEL_GLOBAL, TIPO_PESSOA } from "../enums";

export const usuarioResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  papelGlobal: z.enum(PAPEL_GLOBAL),
  tipoPessoa: z.enum(TIPO_PESSOA),
  documento: z.string(),
  dataNascimento: z.string().date().nullable(),
  criadoEm: z.string().datetime(),
});
export type UsuarioResponse = z.infer<typeof usuarioResponseSchema>;

/** Documento e tipoPessoa ficam de fora de propósito — são imutáveis (documento é único e valida quem é a pessoa; mudar exigiria revalidação). Email/senha têm endpoints próprios que exigem a senha atual, ver alterarEmailSchema/alterarSenhaSchema. */
export const atualizarPerfilSchema = z.object({
  nome: z.string().min(2).max(160).optional(),
  dataNascimento: z.string().date().optional(),
});
export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>;

/** Exige a senha atual — trocar email sem confirmar quem está pedindo seria abrir uma brecha de conta. */
export const alterarEmailSchema = z.object({
  novoEmail: z.string().email(),
  senhaAtual: z.string().min(1),
});
export type AlterarEmailInput = z.infer<typeof alterarEmailSchema>;

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8),
});
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;

/** Bloqueado no backend se o usuário ainda for owner de algum evento — não dá pra apagar a conta e deixar o evento órfão. */
export const deletarContaSchema = z.object({
  senhaAtual: z.string().min(1),
});
export type DeletarContaInput = z.infer<typeof deletarContaSchema>;
