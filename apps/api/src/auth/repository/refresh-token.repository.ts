import type { RefreshTokenModel } from "../model/refresh-token.model";

export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");

export interface CriarRefreshTokenData {
  usuarioId: string;
  tokenHash: string;
  familyId: string;
  expiraEm: Date;
  ip?: string;
  userAgent?: string;
}

export interface RefreshTokenRepository {
  criar(data: CriarRefreshTokenData): Promise<RefreshTokenModel>;
  buscarPorHash(tokenHash: string): Promise<RefreshTokenModel | null>;
  revogar(id: string): Promise<void>;
  revogarFamilia(familyId: string): Promise<void>;
  /** Todas as sessões do usuário, não só uma família — usado ao trocar a senha (força relogin em outros dispositivos). */
  revogarTodasDoUsuario(usuarioId: string): Promise<void>;
}
