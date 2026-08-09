import type { TipoDescontoCupom } from "@events-platform/shared-types";

export class CupomDescontoModel {
  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly codigo: string,
    public readonly tipo: TipoDescontoCupom,
    public readonly valor: number,
    public readonly ativo: boolean,
    public readonly limiteUsos: number | null,
    public readonly usos: number,
    public readonly criadoEm: Date,
  ) {}
}
