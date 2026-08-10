import { Injectable } from "@nestjs/common";
import type { LoteResponse } from "@events-platform/shared-types";
import type { LoteModel } from "../model/lote.model";

@Injectable()
export class LoteMapper {
  toResponse(model: LoteModel): LoteResponse {
    return {
      id: model.id,
      eventoId: model.eventoId,
      nome: model.nome,
      preco: model.preco,
      quantidade: model.quantidade,
      quantidadeEmitida: model.quantidadeEmitida,
      especial: model.especial,
    };
  }
}
