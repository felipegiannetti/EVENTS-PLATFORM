import { Injectable } from "@nestjs/common";
import type { IngressoResponse } from "@events-platform/shared-types";
import type { IngressoModel } from "../model/ingresso.model";

@Injectable()
export class IngressoMapper {
  toResponse(model: IngressoModel): IngressoResponse {
    return {
      id: model.id,
      eventoId: model.eventoId,
      loteId: model.loteId,
      linkVendaId: model.linkVendaId,
      status: model.status,
      qrToken: model.qrToken,
      transferivel: model.transferivel,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
