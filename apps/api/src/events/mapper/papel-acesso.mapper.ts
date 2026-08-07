import { Injectable } from "@nestjs/common";
import type { PapelAcessoResponse } from "@events-platform/shared-types";
import type { PapelAcessoModel } from "../model/papel-acesso.model";

@Injectable()
export class PapelAcessoMapper {
  toResponse(model: PapelAcessoModel): PapelAcessoResponse {
    return {
      usuarioId: model.usuarioId,
      eventoId: model.eventoId,
      papel: model.papel,
    };
  }
}
