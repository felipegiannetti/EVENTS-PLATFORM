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
  /** Ausente = usa o default do schema (true). Cadastro normal passa `false` explicitamente — só esse fluxo exige confirmação; Google já verifica o email. */
  emailConfirmado?: boolean;
}

/**
 * documento fica de fora de propósito — é imutável por design (ver docs) e, sendo criptografado
 * (PrismaUsuarioRepository), passar por aqui gravaria em texto puro sem hash de índice. Se um dia
 * precisar mudar, use um método dedicado que trate criptografia + documentoHash como `criar` já faz.
 */
export interface AtualizarUsuarioData {
  nome?: string;
  dataNascimento?: Date;
  email?: string;
  senhaHash?: string;
  telefone?: string;
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
  /** Incrementa o contador de login falho e retorna o usuário atualizado (pro service decidir se bloqueia). */
  incrementarTentativasFalhas(id: string): Promise<UsuarioModel>;
  /** Bloqueia login até a data informada e zera o contador (o bloqueio em si já é o "reset"). */
  bloquearAte(id: string, ate: Date): Promise<void>;
  /** Zera contador e bloqueio — chamado em login bem-sucedido. */
  resetarTentativasFalhas(id: string): Promise<void>;
  /** Marca o email como confirmado — chamado só pelo fluxo de confirmação (token), nunca por `atualizar`. */
  confirmarEmail(id: string): Promise<void>;
}
