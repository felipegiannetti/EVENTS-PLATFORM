import { Injectable } from "@nestjs/common";
import type { CupomDescontoResponse } from "@events-platform/shared-types";
import type { CupomDescontoModel } from "../model/cupom-desconto.model";

@Injectable()
export class CupomDescontoMapper {
  toResponse(model: CupomDescontoModel): CupomDescontoResponse {
    return {
      id: model.id,
      eventoId: model.eventoId,
      codigo: model.codigo,
      tipo: model.tipo,
      valor: model.valor,
      ativo: model.ativo,
      limiteUsos: model.limiteUsos,
      usos: model.usos,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
