import { Injectable } from "@nestjs/common";
import type { ContaBancariaResponse } from "@events-platform/shared-types";
import type { ContaBancariaModel } from "../model/conta-bancaria.model";

@Injectable()
export class ContaBancariaMapper {
  toResponse(model: ContaBancariaModel): ContaBancariaResponse {
    return {
      banco: model.banco,
      agencia: model.agencia,
      conta: model.conta,
      tipoConta: model.tipoConta,
      titular: model.titular,
      documentoTitular: model.documentoTitular,
      atualizadoEm: model.atualizadoEm.toISOString(),
    };
  }
}
