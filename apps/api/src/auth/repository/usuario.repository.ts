import type { TipoPessoa } from "@events-platform/shared-types";
import type { UsuarioModel } from "../model/usuario.model";

export const USUARIO_REPOSITORY = Symbol("USUARIO_REPOSITORY");

export interface CriarUsuarioData {
  nome: string;
  email: string;
  /** Ausente pra conta criada via Google. */
  senhaHash?: string;
  tipoPessoa?: TipoPessoa;
  /** Ausente pra conta criada via Google (completa depois). */
  documento?: string;
  dataNascimento?: Date;
  telefone?: string;
  googleId?: string;
}

export interface AtualizarUsuarioData {
  nome?: string;
  dataNascimento?: Date;
  email?: string;
  senhaHash?: string;
  telefone?: string;
  documento?: string;
  tipoPessoa?: TipoPessoa;
  googleId?: string;
}

export interface UsuarioRepository {
  criar(data: CriarUsuarioData): Promise<UsuarioModel>;
  buscarPorEmail(email: string): Promise<UsuarioModel | null>;
  buscarPorId(id: string): Promise<UsuarioModel | null>;
  buscarPorDocumento(documento: string): Promise<UsuarioModel | null>;
  buscarPorGoogleId(googleId: string): Promise<UsuarioModel | null>;
  atualizar(id: string, data: AtualizarUsuarioData): Promise<UsuarioModel>;
  remover(id: string): Promise<void>;
}
