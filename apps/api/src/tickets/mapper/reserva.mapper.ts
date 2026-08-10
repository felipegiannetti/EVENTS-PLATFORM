import { Injectable } from "@nestjs/common";
import type { ReservaResponse } from "@events-platform/shared-types";
import type { ReservaModel } from "../model/reserva.model";

@Injectable()
export class ReservaMapper {
  toResponse(model: ReservaModel): ReservaResponse {
    return {
      id: model.id,
      loteId: model.loteId,
      status: model.status,
      expiraEm: model.expiraEm.toISOString(),
      compradorEmail: model.compradorEmail,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
