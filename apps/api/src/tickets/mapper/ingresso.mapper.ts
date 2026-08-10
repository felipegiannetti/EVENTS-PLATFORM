import { Injectable } from "@nestjs/common";
import type { IngressoResponse, MeuIngressoResponse } from "@events-platform/shared-types";
import type { IngressoModel } from "../model/ingresso.model";
import type { MeuIngressoModel } from "../model/meu-ingresso.model";

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
      cancelamentoFlexivel: model.cancelamentoFlexivel,
      compradorNome: model.compradorNome,
      compradorEmail: model.compradorEmail,
      compradorDocumento: model.compradorDocumento,
      cupomCodigo: model.cupomCodigo,
      criadoEm: model.criadoEm.toISOString(),
    };
  }

  toMeuIngressoResponse(model: MeuIngressoModel): MeuIngressoResponse {
    return {
      ...this.toResponse(model),
      eventoNome: model.eventoNome,
      eventoData: model.eventoData.toISOString(),
      loteNome: model.loteNome,
    };
  }
}
