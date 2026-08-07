import { z } from "zod";
import { TIPO_CONTA_BANCARIA } from "../enums";
import { CODIGOS_BANCOS_BRASIL } from "../data/bancos-brasil";
import { validarCpfOuCnpj } from "../validators/documento";

/**
 * "banco" guarda o código Febraban/COMPE (ver data/bancos-brasil.ts), não texto livre —
 * elimina banco inexistente por digitação. "documentoTitular" aceita CPF (PF) ou CNPJ (PJ),
 * validado por dígito verificador real (não só tamanho).
 *
 * O que NÃO dá pra validar sem uma integração bancária/gateway real (fica pra fatia de
 * checkout, quando o Asaas entrar — ver docs/architecture/09-modelo-financeiro.md): se a
 * agência+conta específica realmente existe e pertence a esse titular naquele banco.
 */
export const cadastrarContaBancariaSchema = z.object({
  banco: z.enum(CODIGOS_BANCOS_BRASIL),
  agencia: z
    .string()
    .regex(/^\d{1,6}$/, "agência deve ter só números (sem dígito verificador)"),
  conta: z
    .string()
    .regex(/^\d{1,12}-?\d$/, "conta deve ser números, com o dígito verificador no final (ex: 12345-6)"),
  tipoConta: z.enum(TIPO_CONTA_BANCARIA),
  titular: z.string().min(2).max(160),
  documentoTitular: z
    .string()
    .refine(validarCpfOuCnpj, "CPF ou CNPJ inválido (dígito verificador não confere)"),
});
export type CadastrarContaBancariaInput = z.infer<typeof cadastrarContaBancariaSchema>;

export const contaBancariaResponseSchema = z.object({
  banco: z.string(),
  agencia: z.string(),
  conta: z.string(),
  tipoConta: z.enum(TIPO_CONTA_BANCARIA),
  titular: z.string(),
  documentoTitular: z.string(),
  atualizadoEm: z.string().datetime(),
});
export type ContaBancariaResponse = z.infer<typeof contaBancariaResponseSchema>;
