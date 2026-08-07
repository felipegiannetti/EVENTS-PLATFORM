import type { PapelEvento } from "@events-platform/shared-types";

export class PapelAcessoModel {
  constructor(
    public readonly usuarioId: string,
    public readonly eventoId: string,
    public readonly papel: PapelEvento,
    /** Nome/email de quem tem o acesso — junto do PapelAcesso (via Usuario) só pra listagem exibir quem é, sem expor UUID cru na UI. */
    public readonly usuarioNome: string,
    public readonly usuarioEmail: string,
  ) {}
}
