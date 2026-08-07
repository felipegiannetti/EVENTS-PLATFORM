import type { TipoContaBancaria } from "@events-platform/shared-types";
import type { ContaBancariaModel } from "../model/conta-bancaria.model";

export const CONTA_BANCARIA_REPOSITORY = Symbol("CONTA_BANCARIA_REPOSITORY");

export interface UpsertContaBancariaData {
  eventoId: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: TipoContaBancaria;
  titular: string;
  documentoTitular: string;
}

export interface ContaBancariaRepository {
  upsert(data: UpsertContaBancariaData): Promise<ContaBancariaModel>;
  buscarPorEvento(eventoId: string): Promise<ContaBancariaModel | null>;
}
