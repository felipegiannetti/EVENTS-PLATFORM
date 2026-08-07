import type { LinkVendaModel } from "../model/link-venda.model";

export const LINK_VENDA_REPOSITORY = Symbol("LINK_VENDA_REPOSITORY");

export interface CriarLinkVendaData {
  eventoId: string;
  slug: string;
  origem: string;
}

export interface LinkVendaRepository {
  criar(data: CriarLinkVendaData): Promise<LinkVendaModel>;
  buscarPorId(id: string): Promise<LinkVendaModel | null>;
  listarPorEvento(eventoId: string): Promise<LinkVendaModel[]>;
}
