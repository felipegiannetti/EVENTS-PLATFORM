import { randomBytes, randomUUID, createHash } from "node:crypto";
import { BadRequestException, ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import {
  apenasDigitos,
  type AtualizarPerfilInput,
  type AuthResponse,
  type CompletarDocumentoInput,
  type ReenviarConfirmacaoEmailResponse,
  type RegisterInput,
  type TipoPessoa,
} from "@events-platform/shared-types";
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
import { DocumentoJaDefinidoException } from "./exceptions/documento-ja-definido.exception";
import { RefreshTokenInvalidoException } from "./exceptions/refresh-token-invalido.exception";
import { UsuarioNaoEncontradoException } from "./exceptions/usuario-nao-encontrado.exception";
import { SenhaAtualInvalidaException } from "./exceptions/senha-atual-invalida.exception";
import { ContaComEventosException } from "./exceptions/conta-com-eventos.exception";
import { ContaSemSenhaException } from "./exceptions/conta-sem-senha.exception";
import { ContaBloqueadaException } from "./exceptions/conta-bloqueada.exception";
import { TokenConfirmacaoInvalidoException } from "./exceptions/token-confirmacao-invalido.exception";
import { PrismaService } from "../infra/prisma/prisma.service";
import { MailService } from "../infra/mail/mail.service";
import { escaparHtml } from "../infra/mail/escapar-html.util";
import { criptografar, hashDeterministico } from "../infra/crypto/campo-criptografado.util";

export interface SessaoContexto {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private static readonly MAX_TENTATIVAS_LOGIN = 5;
  private static readonly BLOQUEIO_MINUTOS = 15;
  private static readonly PRAZO_CONFIRMACAO_EMAIL_HORAS = 24;

  private readonly logger = new Logger(AuthService.name);
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
    private readonly mail: MailService,
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
    const chaveDocumento = this.config.getOrThrow<string>("DOCUMENTO_ENCRYPTION_KEY");
    // Normalizado pra só dígitos — "123.456.789-00" e "12345678900" não podem virar registros
    // diferentes pro mesmo documento (quebraria a checagem de duplicidade).
    const documentoNormalizado = apenasDigitos(dados.documento);
    const usuarioId = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senhaHash,
          tipoPessoa: dados.tipoPessoa,
          // Criptografado (AES-256-GCM) + documentoHash como índice determinístico — mesmo padrão de
          // PrismaUsuarioRepository.criar(), que este fluxo não usa (precisa da transação com Indicacao).
          documento: criptografar(documentoNormalizado, chaveDocumento),
          documentoHash: hashDeterministico(documentoNormalizado, chaveDocumento),
          dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
          telefone: dados.telefone,
          // Único fluxo que exige confirmação — Google já verifica o email (default do schema fica true).
          emailConfirmado: false,
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
    try {
      await this.enviarConfirmacaoEmail(usuario);
    } catch (erro) {
      // Melhor esforço — mesmo padrão do email de confirmação de ingresso: a conta já foi criada,
      // não desfazemos o cadastro só porque o SMTP falhou. O usuário sempre pode reenviar depois.
      this.logger.warn(`Não foi possível enviar o email de confirmação da conta ${usuario.id}: ${(erro as Error).message}`);
    }
    return usuario;
  }

  /**
   * Reenvio explícito (botão "reenviar" ou tela de aviso) — pedido por quem já está logado mas
   * ainda não confirmou. Idempotente: se já confirmado, só avisa, não trata como erro.
   */
  async reenviarConfirmacaoEmail(usuarioId: string): Promise<ReenviarConfirmacaoEmailResponse> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (usuario.emailConfirmado) {
      return { mensagem: "Seu email já está confirmado." };
    }
    await this.enviarConfirmacaoEmail(usuario);
    return { mensagem: "Enviamos um novo link de confirmação para o seu email." };
  }

  async confirmarEmail(token: string): Promise<void> {
    const registro = await this.prisma.tokenConfirmacaoEmail.findFirst({
      where: { tokenHash: this.hashToken(token), expiraEm: { gt: new Date() } },
    });
    if (!registro) {
      throw new TokenConfirmacaoInvalidoException();
    }
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id: registro.usuarioId }, data: { emailConfirmado: true } }),
      this.prisma.tokenConfirmacaoEmail.delete({ where: { id: registro.id } }),
    ]);
  }

  private async enviarConfirmacaoEmail(usuario: UsuarioModel): Promise<void> {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    await this.prisma.tokenConfirmacaoEmail.upsert({
      where: { usuarioId: usuario.id },
      create: {
        usuarioId: usuario.id,
        tokenHash,
        expiraEm: new Date(Date.now() + AuthService.PRAZO_CONFIRMACAO_EMAIL_HORAS * 60 * 60 * 1000),
      },
      update: {
        tokenHash,
        expiraEm: new Date(Date.now() + AuthService.PRAZO_CONFIRMACAO_EMAIL_HORAS * 60 * 60 * 1000),
      },
    });

    const origemWeb = (this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3001").split(",")[0]!.replace(/\/$/, "");
    const link = `${origemWeb}/confirmar-email?token=${encodeURIComponent(token)}`;
    await this.mail.enviar({
      para: [usuario.email],
      assunto: "[RARO Tickets] Confirme seu email",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16152a"><h1 style="font-size:22px">Confirme seu email</h1><p>Olá, ${escaparHtml(usuario.nome)}. Falta só um passo pra usar sua conta na RARO Tickets — confirme seu email clicando no botão abaixo.</p><p><a href="${link}" style="display:inline-block;background:#6d28d9;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold">Confirmar email</a></p><p style="font-size:12px;color:#6b6880">O link expira em 24 horas. Se você não criou essa conta, ignore este email.</p></div>`,
    });
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

  /**
   * Só pra quem ainda não tem `documento` (conta criada via Google, que não pede CPF/CNPJ no OAuth).
   * Depois de definido, vira imutável igual ao cadastro normal — sem endpoint de edição. `tipoPessoa`
   * é inferido pela quantidade de dígitos do documento (mesma lógica de `validarCpfOuCnpj`).
   */
  async completarDocumento(usuarioId: string, input: CompletarDocumentoInput): Promise<UsuarioModel> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (usuario.documento) {
      throw new DocumentoJaDefinidoException();
    }
    const existente = await this.usuarioRepository.buscarPorDocumento(input.documento);
    if (existente) {
      throw new DocumentoJaCadastradoException();
    }
    const chave = this.config.getOrThrow<string>("DOCUMENTO_ENCRYPTION_KEY");
    const documentoNormalizado = apenasDigitos(input.documento);
    const tipoPessoa: TipoPessoa = documentoNormalizado.length === 14 ? "juridica" : "fisica";
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        documento: criptografar(documentoNormalizado, chave),
        documentoHash: hashDeterministico(documentoNormalizado, chave),
        tipoPessoa,
        dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : undefined,
      },
    });
    return this.buscarPerfil(usuarioId);
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
    await this.prisma.auditLog.create({
      data: { usuarioId, acao: "ALTERAR_SENHA", entidade: "Usuario", entidadeId: usuarioId },
    });
  }

  async deletarConta(usuarioId: string, senhaAtual: string): Promise<void> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (!usuario.senhaHash) {
      throw new ContaSemSenhaException();
    }
    if (!(await argon2.verify(usuario.senhaHash, senhaAtual))) {
      throw new SenhaAtualInvalidaException();
    }
    await this.executarExclusaoConta(usuario);
  }

  /**
   * Conta sem senha (Google) não tem como confirmar exclusão com `senhaAtual` — pede confirmação
   * por email (mesmo padrão de token opaco de `enviarConfirmacaoEmail`). As checagens de bloqueio
   * (owner de evento, vínculo de indicação, acordo comercial) já rodam aqui, antes de mandar o
   * email — não faz sentido pedir confirmação pra uma exclusão que ia falhar de qualquer jeito.
   */
  async solicitarExclusaoConta(usuarioId: string): Promise<ReenviarConfirmacaoEmailResponse> {
    const usuario = await this.buscarPerfil(usuarioId);
    if (usuario.senhaHash) {
      throw new BadRequestException("Sua conta tem senha própria — use a exclusão normal (com senha).");
    }
    await this.validarPodeExcluirConta(usuarioId);

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    await this.prisma.tokenExclusaoConta.upsert({
      where: { usuarioId },
      create: { usuarioId, tokenHash, expiraEm: new Date(Date.now() + AuthService.PRAZO_CONFIRMACAO_EMAIL_HORAS * 60 * 60 * 1000) },
      update: { tokenHash, expiraEm: new Date(Date.now() + AuthService.PRAZO_CONFIRMACAO_EMAIL_HORAS * 60 * 60 * 1000) },
    });

    const origemWeb = (this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3001").split(",")[0]!.replace(/\/$/, "");
    const link = `${origemWeb}/excluir-conta?token=${encodeURIComponent(token)}`;
    await this.mail.enviar({
      para: [usuario.email],
      assunto: "[RARO Tickets] Confirme a exclusão da sua conta",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16152a"><h1 style="font-size:22px">Confirme a exclusão da sua conta</h1><p>Olá, ${escaparHtml(usuario.nome)}. Recebemos um pedido pra excluir sua conta na RARO Tickets permanentemente.</p><p><a href="${link}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold">Excluir minha conta</a></p><p style="font-size:12px;color:#6b6880">O link expira em 24 horas. Se você não pediu isso, ignore este email — sua conta continua ativa.</p></div>`,
    });
    return { mensagem: "Enviamos um link de confirmação para o email da sua conta." };
  }

  async confirmarExclusaoConta(token: string): Promise<void> {
    const registro = await this.prisma.tokenExclusaoConta.findFirst({
      where: { tokenHash: this.hashToken(token), expiraEm: { gt: new Date() } },
    });
    if (!registro) {
      throw new TokenConfirmacaoInvalidoException();
    }
    const usuario = await this.buscarPerfil(registro.usuarioId);
    await this.validarPodeExcluirConta(usuario.id);
    await this.executarExclusaoConta(usuario);
  }

  /** Bloqueios que impedem excluir a conta — compartilhado pelos dois fluxos (senha e token por email). */
  private async validarPodeExcluirConta(usuarioId: string): Promise<void> {
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
    // AcordoComercial.organizador/definidoPorAdmin é onDelete: Restrict no schema — sem essa checagem,
    // excluir uma conta com acordo comercial vinculado estouraria uma violação de FK crua do Prisma
    // em vez de um erro de domínio amigável. (AuditLog.usuario já é SetNull — não precisa checar.)
    const possuiAcordoComercial = await this.prisma.acordoComercial.findFirst({
      where: { OR: [{ organizadorId: usuarioId }, { definidoPorAdminId: usuarioId }] },
      select: { id: true },
    });
    if (possuiAcordoComercial) {
      throw new ConflictException(
        "Sua conta possui acordos comerciais vinculados e não pode ser excluída diretamente. Fale com o suporte.",
      );
    }
  }

  private async executarExclusaoConta(usuario: UsuarioModel): Promise<void> {
    const usuarioId = usuario.id;
    await this.refreshTokenRepository.revogarTodasDoUsuario(usuarioId);
    await this.prisma.$transaction(async (tx) => {
      // Ingresso não tem FK pra Usuario (compradorEmail é só texto) — sem isso, o nome/email/documento
      // do comprador sobrevive intacto à exclusão da conta (gap de LGPD, direito ao esquecimento).
      await tx.ingresso.updateMany({
        where: { compradorEmail: usuario.email },
        data: { compradorNome: "Usuário excluído", compradorEmail: null, compradorDocumento: null },
      });
      // Escrito antes do delete, mas o onDelete: SetNull do schema zera usuarioId automaticamente
      // quando o usuario.delete abaixo roda — o registro do evento sobrevive à conta.
      await tx.auditLog.create({
        data: { usuarioId, acao: "EXCLUIR_CONTA", entidade: "Usuario", entidadeId: usuarioId },
      });
      await tx.usuario.delete({ where: { id: usuarioId } });
    });
  }

  async validarCredenciais(email: string, senha: string): Promise<UsuarioModel | null> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    // Sem senhaHash = conta só-Google — trata como credencial inválida (não vaza que é conta Google).
    if (!usuario || !usuario.senhaHash) {
      return null;
    }
    if (usuario.bloqueadoAte && usuario.bloqueadoAte.getTime() > Date.now()) {
      throw new ContaBloqueadaException(usuario.bloqueadoAte);
    }
    const senhaValida = await argon2.verify(usuario.senhaHash, senha);
    if (!senhaValida) {
      const atualizado = await this.usuarioRepository.incrementarTentativasFalhas(usuario.id);
      await this.prisma.auditLog.create({
        data: { usuarioId: usuario.id, acao: "LOGIN_FALHO", entidade: "Usuario", entidadeId: usuario.id },
      });
      if (atualizado.tentativasFalhas >= AuthService.MAX_TENTATIVAS_LOGIN) {
        await this.usuarioRepository.bloquearAte(
          usuario.id,
          new Date(Date.now() + AuthService.BLOQUEIO_MINUTOS * 60_000),
        );
      }
      return null;
    }
    if (usuario.tentativasFalhas > 0 || usuario.bloqueadoAte) {
      await this.usuarioRepository.resetarTentativasFalhas(usuario.id);
    }
    return usuario;
  }

  async login(usuario: UsuarioModel, contexto: SessaoContexto = {}): Promise<AuthResponse> {
    await this.prisma.auditLog.create({
      data: {
        usuarioId: usuario.id,
        acao: "LOGIN",
        entidade: "Usuario",
        entidadeId: usuario.id,
        ip: contexto.ip,
        dispositivo: contexto.userAgent,
      },
    });
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
