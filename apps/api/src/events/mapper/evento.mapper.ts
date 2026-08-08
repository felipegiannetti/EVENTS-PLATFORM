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
      dataFim: model.dataFim ? model.dataFim.toISOString() : null,
      cidade: model.cidade,
      estado: model.estado,
      pais: model.pais,
      rua: model.rua,
      numero: model.numero,
      complemento: model.complemento,
      bairro: model.bairro,
      cep: model.cep,
      somenteMaioresDeIdade: model.somenteMaioresDeIdade,
      categoria: model.categoria,
      transferivel: model.transferivel,
      taxaPagaPor: model.taxaPagaPor,
      publicado: model.publicado,
      descricao: model.descricao,
      contatoNome: model.contatoNome,
      contatoEmail: model.contatoEmail,
      contatoTelefone: model.contatoTelefone,
      temBanner: model.temBanner,
      criadoEm: model.criadoEm.toISOString(),
    };
  }
}
