import { randomBytes, randomUUID, createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { AuthResponse } from "@events-platform/shared-types";
import { USUARIO_REPOSITORY, type UsuarioRepository } from "./repository/usuario.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "./repository/refresh-token.repository";
import { UsuarioModel } from "./model/usuario.model";
import { EmailJaCadastradoException } from "./exceptions/email-ja-cadastrado.exception";
import { RefreshTokenInvalidoException } from "./exceptions/refresh-token-invalido.exception";

export interface SessaoContexto {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTtlDays: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshTtlDays = Number(this.config.get("JWT_REFRESH_TTL_DAYS") ?? 90);
  }

  async registrar(nome: string, email: string, senha: string): Promise<UsuarioModel> {
    const existente = await this.usuarioRepository.buscarPorEmail(email);
    if (existente) {
      throw new EmailJaCadastradoException();
    }

    const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });
    return this.usuarioRepository.criar({ nome, email, senhaHash });
  }

  async validarCredenciais(email: string, senha: string): Promise<UsuarioModel | null> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      return null;
    }
    const senhaValida = await argon2.verify(usuario.senhaHash, senha);
    return senhaValida ? usuario : null;
  }

  async login(usuario: UsuarioModel, contexto: SessaoContexto = {}): Promise<AuthResponse> {
    return this.emitirSessao(usuario, randomUUID(), contexto);
  }

  /**
   * Rotação com janela deslizante: cada refresh revoga o token apresentado e emite um par novo
   * com validade renovada por mais `refreshTtlDays`. Se o token apresentado já tiver sido revogado
   * antes (reuso de um token "gasto"), é sinal de roubo — revoga a família inteira.
   */
  async refresh(refreshTokenPlano: string, contexto: SessaoContexto = {}): Promise<AuthResponse> {
    const tokenHash = this.hashToken(refreshTokenPlano);
    const registro = await this.refreshTokenRepository.buscarPorHash(tokenHash);

    if (!registro) {
      throw new RefreshTokenInvalidoException();
    }

    if (registro.revogado) {
      await this.refreshTokenRepository.revogarFamilia(registro.familyId);
      throw new RefreshTokenInvalidoException(
        "Reuso de refresh token detectado — todas as sessões desta família foram revogadas.",
      );
    }

    if (registro.expirado) {
      throw new RefreshTokenInvalidoException();
    }

    const usuario = await this.usuarioRepository.buscarPorId(registro.usuarioId);
    if (!usuario) {
      throw new RefreshTokenInvalidoException();
    }

    await this.refreshTokenRepository.revogar(registro.id);
    return this.emitirSessao(usuario, registro.familyId, contexto);
  }

  async logout(refreshTokenPlano: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenPlano);
    const registro = await this.refreshTokenRepository.buscarPorHash(tokenHash);
    if (registro && !registro.revogado) {
      await this.refreshTokenRepository.revogar(registro.id);
    }
  }

  private async emitirSessao(
    usuario: UsuarioModel,
    familyId: string,
    contexto: SessaoContexto,
  ): Promise<AuthResponse> {
    const accessTtl = this.config.get<string>("JWT_ACCESS_TTL") ?? "15m";
    const accessToken = this.jwtService.sign(
      { sub: usuario.id, email: usuario.email, papelGlobal: usuario.papelGlobal },
      { secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"), expiresIn: accessTtl },
    );

    const refreshTokenPlano = randomBytes(32).toString("base64url");
    const expiraEm = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepository.criar({
      usuarioId: usuario.id,
      tokenHash: this.hashToken(refreshTokenPlano),
      familyId,
      expiraEm,
      ip: contexto.ip,
      userAgent: contexto.userAgent,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlano,
      expiraEm: expiraEm.toISOString(),
    };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
