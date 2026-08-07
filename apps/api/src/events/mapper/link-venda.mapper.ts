import { Injectable } from "@nestjs/common";
import type { LinkVendaResponse } from "@events-platform/shared-types";
import type { LinkVendaModel } from "../model/link-venda.model";

@Injectable()
export class LinkVendaMapper {
  toResponse(model: LinkVendaModel): LinkVendaResponse {
    return {
      id: model.id,
      eventoId: model.eventoId,
      slug: model.slug,
      origem: model.origem,
    };
  }
}
