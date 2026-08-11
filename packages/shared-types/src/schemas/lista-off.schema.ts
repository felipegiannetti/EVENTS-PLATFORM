import { z } from "zod";
import { validarCpf } from "../validators/documento";

const cpfSchema = z.string().refine(validarCpf, "CPF inválido.");

export const criarListaOffGrupoSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  entradaAte: z.string().datetime().nullable().optional(),
});
export type CriarListaOffGrupoInput = z.infer<typeof criarListaOffGrupoSchema>;

export const atualizarListaOffGrupoSchema = criarListaOffGrupoSchema.partial().refine(
  (valor) => Object.keys(valor).length > 0,
  "Informe ao menos um campo para atualizar.",
);
export type AtualizarListaOffGrupoInput = z.infer<typeof atualizarListaOffGrupoSchema>;

export const listaOffGrupoResponseSchema = z.object({
  id: z.string().uuid(),
  eventoId: z.string().uuid(),
  nome: z.string(),
  entradaAte: z.string().datetime().nullable(),
  totalPessoas: z.number().int().nonnegative(),
  totalCheckins: z.number().int().nonnegative(),
  criadoEm: z.string().datetime(),
});
export type ListaOffGrupoResponse = z.infer<typeof listaOffGrupoResponseSchema>;

export const importarPessoasListaOffSchema = z.object({
  conteudo: z.string().trim().min(1).max(100_000),
});
export type ImportarPessoasListaOffInput = z.infer<typeof importarPessoasListaOffSchema>;

export const atualizarPessoaListaOffSchema = z.object({
  nomeCompleto: z.string().trim().min(3).max(160),
  cpf: cpfSchema,
});
export type AtualizarPessoaListaOffInput = z.infer<typeof atualizarPessoaListaOffSchema>;

export const pessoaListaOffResponseSchema = z.object({
  id: z.string().uuid(),
  listaId: z.string().uuid(),
  nomeCompleto: z.string(),
  cpf: z.string(),
  statusUso: z.boolean(),
  usadoEm: z.string().datetime().nullable(),
  criadoEm: z.string().datetime(),
});
export type PessoaListaOffResponse = z.infer<typeof pessoaListaOffResponseSchema>;

export const pessoasListaOffPaginadasSchema = z.object({
  itens: z.array(pessoaListaOffResponseSchema),
  total: z.number().int().nonnegative(),
  pagina: z.number().int().positive(),
  totalPaginas: z.number().int().positive(),
});
export type PessoasListaOffPaginadas = z.infer<typeof pessoasListaOffPaginadasSchema>;

export const importarPessoasListaOffResponseSchema = z.object({ adicionadas: z.number().int().positive() });
export type ImportarPessoasListaOffResponse = z.infer<typeof importarPessoasListaOffResponseSchema>;
