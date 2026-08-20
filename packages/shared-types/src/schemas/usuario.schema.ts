import { z } from "zod";
import { PAPEL_GLOBAL, TIPO_PESSOA } from "../enums";
import { MENSAGEM_SENHA_FRACA, senhaEhForte } from "../validators/senha";
import { validarCnpj, validarCpf } from "../validators/documento";

export const usuarioResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  papelGlobal: z.enum(PAPEL_GLOBAL),
  tipoPessoa: z.enum(TIPO_PESSOA),
  /** Nulo pra conta criada via Google que ainda não completou o cadastro (CPF/CNPJ). */
  documento: z.string().nullable(),
  dataNascimento: z.string().date().nullable(),
  telefone: z.string().nullable(),
  /** true = conta usa "Continuar com Google" (sem senha própria — telas de trocar/apagar senha não se aplicam). */
  usaGoogle: z.boolean(),
  emailConfirmado: z.boolean(),
  criadoEm: z.string().datetime(),
});
export type UsuarioResponse = z.infer<typeof usuarioResponseSchema>;

/** Documento e tipoPessoa ficam de fora de propósito — são imutáveis (documento é único e valida quem é a pessoa; mudar exigiria revalidação). Email/senha têm endpoints próprios que exigem a senha atual, ver alterarEmailSchema/alterarSenhaSchema. */
export const atualizarPerfilSchema = z.object({
  nome: z.string().min(2).max(160).optional(),
  dataNascimento: z.string().date().optional(),
  telefone: z.string().min(10).max(20).optional(),
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
  novaSenha: z.string().min(8).max(72).refine(senhaEhForte, { message: MENSAGEM_SENHA_FRACA }),
});
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;

/**
 * Só pra quem ainda não tem `documento` (conta criada via Google) — uma vez definido, vira
 * imutável igual ao cadastro normal (backend rejeita se já existir). `tipoPessoa` não é pedido:
 * é inferido pela quantidade de dígitos (11 = CPF/pessoa física, 14 = CNPJ/pessoa jurídica).
 */
export const completarDocumentoSchema = z
  .object({
    documento: z.string().min(11).max(18),
    dataNascimento: z.string().date().optional(),
  })
  .superRefine((dados, ctx) => {
    const digitos = dados.documento.replace(/\D/g, "");
    if (digitos.length === 11) {
      if (!validarCpf(dados.documento)) {
        ctx.addIssue({ code: "custom", path: ["documento"], message: "CPF inválido (dígito verificador não confere)" });
      }
      if (!dados.dataNascimento) {
        ctx.addIssue({ code: "custom", path: ["dataNascimento"], message: "Data de nascimento é obrigatória para pessoa física" });
      }
    } else if (digitos.length === 14) {
      if (!validarCnpj(dados.documento)) {
        ctx.addIssue({ code: "custom", path: ["documento"], message: "CNPJ inválido (dígito verificador não confere)" });
      }
    } else {
      ctx.addIssue({ code: "custom", path: ["documento"], message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)" });
    }
  });
export type CompletarDocumentoInput = z.infer<typeof completarDocumentoSchema>;

/** Bloqueado no backend se o usuário ainda for owner de algum evento — não dá pra apagar a conta e deixar o evento órfão. */
export const deletarContaSchema = z.object({
  senhaAtual: z.string().min(1),
});
export type DeletarContaInput = z.infer<typeof deletarContaSchema>;
