import { Injectable } from "@nestjs/common";
import type { UsuarioResponse } from "@events-platform/shared-types";
import type { UsuarioModel } from "../model/usuario.model";

@Injectable()
export class UsuarioMapper {
  toResponse(model: UsuarioModel): UsuarioResponse {
    return {
      id: model.id,
      nome: model.nome,
      email: model.email,
      papelGlobal: model.papelGlobal,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
