import type { PapelGlobal, TipoPessoa } from "@events-platform/shared-types";

export class UsuarioModel {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email: string,
    /** Nulo pra conta criada via Google (sem senha própria). */
    public readonly senhaHash: string | null,
    public readonly papelGlobal: PapelGlobal,
    public readonly tipoPessoa: TipoPessoa,
    /** Nulo até a conta criada via Google completar o cadastro. */
    public readonly documento: string | null,
    public readonly dataNascimento: Date | null,
    public readonly telefone: string | null,
    public readonly googleId: string | null,
    public readonly criadoEm: Date,
    public readonly tentativasFalhas: number = 0,
    public readonly bloqueadoAte: Date | null = null,
    public readonly emailConfirmado: boolean = true,
  ) {}
}
