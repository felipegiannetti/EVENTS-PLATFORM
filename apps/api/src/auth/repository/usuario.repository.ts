import type { UsuarioModel } from "../model/usuario.model";

export const USUARIO_REPOSITORY = Symbol("USUARIO_REPOSITORY");

export interface CriarUsuarioData {
  nome: string;
  email: string;
  senhaHash: string;
}

export interface UsuarioRepository {
  criar(data: CriarUsuarioData): Promise<UsuarioModel>;
  buscarPorEmail(email: string): Promise<UsuarioModel | null>;
  buscarPorId(id: string): Promise<UsuarioModel | null>;
}
