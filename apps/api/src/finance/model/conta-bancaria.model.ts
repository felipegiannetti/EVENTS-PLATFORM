import type { TipoContaBancaria } from "@events-platform/shared-types";

export class ContaBancariaModel {
  constructor(
    public readonly eventoId: string,
    public readonly banco: string,
    public readonly agencia: string,
    public readonly conta: string,
    public readonly tipoConta: TipoContaBancaria,
    public readonly titular: string,
    public readonly documentoTitular: string,
    public readonly atualizadoEm: Date,
  ) {}
}
