import type { PapelEvento } from "@events-platform/shared-types";
import type { PapelAcessoModel } from "../model/papel-acesso.model";

export const PAPEL_ACESSO_REPOSITORY = Symbol("PAPEL_ACESSO_REPOSITORY");

export interface PapelAcessoRepository {
  criar(usuarioId: string, eventoId: string, papel: PapelEvento): Promise<PapelAcessoModel>;
  remover(usuarioId: string, eventoId: string): Promise<void>;
  buscar(usuarioId: string, eventoId: string): Promise<PapelAcessoModel | null>;
  listarPorEvento(eventoId: string): Promise<PapelAcessoModel[]>;
}
