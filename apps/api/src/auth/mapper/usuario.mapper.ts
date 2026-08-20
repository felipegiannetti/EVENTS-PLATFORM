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
      tipoPessoa: model.tipoPessoa,
      documento: model.documento,
      dataNascimento: model.dataNascimento ? model.dataNascimento.toISOString().slice(0, 10) : null,
      telefone: model.telefone,
      usaGoogle: model.googleId !== null,
      emailConfirmado: model.emailConfirmado,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
