import type { PapelGlobal } from "@events-platform/shared-types";

export class UsuarioModel {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email: string,
    public readonly senhaHash: string,
    public readonly papelGlobal: PapelGlobal,
    public readonly criadoEm: Date,
  ) {}
}
