import type { TipoPessoa } from "@events-platform/shared-types";
import type { UsuarioModel } from "../model/usuario.model";

export const USUARIO_REPOSITORY = Symbol("USUARIO_REPOSITORY");

export interface CriarUsuarioData {
  nome: string;
  email: string;
  senhaHash: string;
  tipoPessoa: TipoPessoa;
  documento: string;
  dataNascimento?: Date;
}

export interface AtualizarUsuarioData {
  nome?: string;
  dataNascimento?: Date;
  email?: string;
  senhaHash?: string;
}

export interface UsuarioRepository {
  criar(data: CriarUsuarioData): Promise<UsuarioModel>;
  buscarPorEmail(email: string): Promise<UsuarioModel | null>;
  buscarPorId(id: string): Promise<UsuarioModel | null>;
  buscarPorDocumento(documento: string): Promise<UsuarioModel | null>;
  atualizar(id: string, data: AtualizarUsuarioData): Promise<UsuarioModel>;
  remover(id: string): Promise<void>;
}
