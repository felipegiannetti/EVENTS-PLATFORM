import type { PapelEvento } from "@events-platform/shared-types";

export class PapelAcessoModel {
  constructor(
    public readonly usuarioId: string,
    public readonly eventoId: string,
    public readonly papel: PapelEvento,
  ) {}
}
