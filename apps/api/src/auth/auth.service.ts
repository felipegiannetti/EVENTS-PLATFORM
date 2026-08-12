import { randomBytes, randomUUID, createHash } from "node:crypto";
import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { AtualizarPerfilInput, AuthResponse, RegisterInput } from "@events-platform/shared-types";
import { USUARIO_REPOSITORY, type UsuarioRepository } from "./repository/usuario.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "./repository/refresh-token.repository";
import {
  PAPEL_ACESSO_REPOSITORY,
  type PapelAcessoRepository,
} from "../events/repository/papel-acesso.repository";
import { UsuarioModel } from "./model/usuario.model";
import { EmailJaCadastradoException } from "./exceptions/email-ja-cadastrado.exception";
import { DocumentoJaCadastradoException } from "./exceptions/documento-ja-cadastrado.exception";
import { RefreshTokenInvalidoException } from "./exceptions/refresh-token-invalido.exception";
import { UsuarioNaoEncontradoException } from "./exceptions/usuario-nao-encontrado.exception";
import { SenhaAtualInvalidaException } from "./exceptions/senha-atual-invalida.exception";
import { ContaComEventosException } from "./exceptions/conta-com-eventos.exception";
import { ContaSemSenhaException } from "./exceptions/conta-sem-senha.exception";
import { PrismaService } from "../infra/prisma/prisma.service";

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
    @Inject(PAPEL_ACESSO_REPOSITORY)
    private readonly papelAcessoRepository: PapelAcessoRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.refreshTtlDays = Number(this.config.get("JWT_REFRESH_TTL_DAYS") ?? 90);
  }

  async registrar(dados: RegisterInput): Promise<UsuarioModel> {
    const [existentePorEmail, existentePorDocumento, oferta] = await Promise.all([
      this.usuarioRepository.buscarPorEmail(dados.email),
      this.usuarioRepository.buscarPorDocumento(dados.documento),
      dados.codigoIndicacao
        ? this.prisma.ofertaIndicacao.findFirst({
            where: { codigo: dados.codigoIndicacao, ativo: true, programa: { ativo: true } },
            select: {
              id: true,
              percentualBeneficioOrganizador: true,
              programa: { select: { usuarioId: true } },
            },
          })
        : Promise.resolve(null),
    ]);
    if (existentePorEmail) {
      throw new EmailJaCadastradoException();
    }
    if (existentePorDocumento) {
      throw new DocumentoJaCadastradoException();
    }
    if (dados.codigoIndicacao && !oferta) {
      throw new BadRequestException("Link de indicação inválido ou desativado.");
    }

    const senhaHash = await argon2.hash(dados.senha, { type: argon2.argon2id });
    const usuarioId = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senhaHash,
          tipoPessoa: dados.tipoPessoa,
          documento: dados.documento,
          dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
          telefone: dados.telefone,
        },
        select: { id: true },
      });
      if (oferta) {
        await tx.indicacao.create({
          data: {
            indicadorId: oferta.programa.usuarioId,
            indicadoId: usuario.id,
            ofertaId: oferta.id,
            percentualBeneficioOrganizador: oferta.percentualBeneficioOrganizador,
          },
        });
      }
      return usuario.id;
    });
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) throw new Error("Usuário criado não foi encontrado.");
    return usuario;
  }

  async buscarPerfil(usuarioId: string): Promise<UsuarioModel> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UsuarioNaoEncontradoException();
    }
    return usuario;
  }

  async atualizarPerfil(usuarioId: string, input: AtualizarPerfilInput): Promise<UsuarioModel> {
    return this.usuarioRepository.atualizar(usuarioId, {
      nome: input.nome,
      dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : undefined,
      telefone: input.telefone,
    });
  }

  async alterarEmail(usuarioId: string, novoEmail: string, senhaAtual: string): Promise<UsuarioModel> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (!usuario.senhaHash) {
      throw new ContaSemSenhaException();
    }
    if (!(await argon2.verify(usuario.senhaHash, senhaAtual))) {
      throw new SenhaAtualInvalidaException();
    }
    const existente = await this.usuarioRepository.buscarPorEmail(novoEmail);
    if (existente && existente.id !== usuarioId) {
      throw new EmailJaCadastradoException();
    }
    return this.usuarioRepository.atualizar(usuarioId, { email: novoEmail });
  }

  /** Troca a senha e revoga todas as sessões (força relogin em outros dispositivos — padrão de segurança). */
  async alterarSenha(usuarioId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (!usuario.senhaHash) {
      throw new ContaSemSenhaException();
    }
    if (!(await argon2.verify(usuario.senhaHash, senhaAtual))) {
      throw new SenhaAtualInvalidaException();
    }
    const senhaHash = await argon2.hash(novaSenha, { type: argon2.argon2id });
    await this.usuarioRepository.atualizar(usuarioId, { senhaHash });
    await this.refreshTokenRepository.revogarTodasDoUsuario(usuarioId);
  }

  async deletarConta(usuarioId: string, senhaAtual: string): Promise<void> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (!usuario.senhaHash) {
      throw new ContaSemSenhaException();
    }
    if (!(await argon2.verify(usuario.senhaHash, senhaAtual))) {
      throw new SenhaAtualInvalidaException();
    }
    const papeis = await this.papelAcessoRepository.listarPorUsuario(usuarioId);
    if (papeis.some((papel) => papel.papel === "owner")) {
      throw new ContaComEventosException();
    }
    const possuiVinculoIndicacao = await this.prisma.indicacao.findFirst({
      where: { OR: [{ indicadorId: usuarioId }, { indicadoId: usuarioId }] },
      select: { id: true },
    });
    const possuiPrograma = await this.prisma.programaIndicacao.findUnique({ where: { usuarioId }, select: { id: true } });
    if (possuiVinculoIndicacao || possuiPrograma) {
      throw new ConflictException("Sua conta possui vínculos financeiros de indicação e não pode ser excluída diretamente.");
    }
    await this.refreshTokenRepository.revogarTodasDoUsuario(usuarioId);
    await this.usuarioRepository.remover(usuarioId);
  }

  async validarCredenciais(email: string, senha: string): Promise<UsuarioModel | null> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    // Sem senhaHash = conta só-Google — trata como credencial inválida (não vaza que é conta Google).
    if (!usuario || !usuario.senhaHash) {
      return null;
    }
    const senhaValida = await argon2.verify(usuario.senhaHash, senha);
    return senhaValida ? usuario : null;
  }

  async login(usuario: UsuarioModel, contexto: SessaoContexto = {}): Promise<AuthResponse> {
    return this.emitirSessao(usuario, randomUUID(), contexto);
  }

  /**
   * Find-or-create-or-link pro login via Google: já vinculado (googleId) -> loga; conta já existe
   * com esse email (cadastro normal antigo) -> vincula o googleId a ela e loga; senão cria uma
   * conta mínima (sem senha, sem documento) que o usuário completa depois em /perfil.
   */
  async loginComGoogle(perfil: { googleId: string; email: string; nome: string }, contexto: SessaoContexto = {}): Promise<AuthResponse> {
    let usuario = await this.usuarioRepository.buscarPorGoogleId(perfil.googleId);
    if (!usuario) {
      const existentePorEmail = await this.usuarioRepository.buscarPorEmail(perfil.email);
      usuario = existentePorEmail
        ? await this.usuarioRepository.atualizar(existentePorEmail.id, { googleId: perfil.googleId })
        : await this.usuarioRepository.criar({ nome: perfil.nome, email: perfil.email, googleId: perfil.googleId });
    }
    return this.login(usuario, contexto);
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
