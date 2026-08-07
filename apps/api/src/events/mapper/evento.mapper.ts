import { Injectable } from "@nestjs/common";
import type { EventoResponse } from "@events-platform/shared-types";
import type { EventoModel } from "../model/evento.model";

@Injectable()
export class EventoMapper {
  toResponse(model: EventoModel): EventoResponse {
    return {
      id: model.id,
      nome: model.nome,
      data: model.data.toISOString(),
      local: model.local,
      categoria: model.categoria,
      transferivel: model.transferivel,
      taxaPagaPor: model.taxaPagaPor,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
