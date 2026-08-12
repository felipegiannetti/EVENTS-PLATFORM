import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import type { AuthResponse } from "@events-platform/shared-types";
import { Public } from "../security/decorators/public.decorator";
import { CurrentUser } from "../security/decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { GoogleAuthGuard } from "./google-auth.guard";
import type { GooglePerfil } from "./google.strategy";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { AtualizarPerfilDto } from "./dto/atualizar-perfil.dto";
import { AlterarEmailDto } from "./dto/alterar-email.dto";
import { AlterarSenhaDto } from "./dto/alterar-senha.dto";
import { DeletarContaDto } from "./dto/deletar-conta.dto";
import { UsuarioMapper } from "./mapper/usuario.mapper";
import type { UsuarioModel } from "./model/usuario.model";
import type { AuthenticatedUser } from "../security/types/authenticated-request";
import { RefreshTokenInvalidoException } from "./exceptions/refresh-token-invalido.exception";

const REFRESH_COOKIE = "refresh_token";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioMapper: UsuarioMapper,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const usuario = await this.authService.registrar(dto);
    const sessao = await this.authService.login(usuario, this.contexto(req));
    this.setRefreshCookie(res, sessao.refreshToken);
    return { usuario: this.usuarioMapper.toResponse(usuario), ...sessao };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @CurrentUser() usuario: unknown,
    @Body() _dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const sessao = await this.authService.login(usuario as UsuarioModel, this.contexto(req));
    this.setRefreshCookie(res, sessao.refreshToken);
    return sessao;
  }

  /** Só dispara o redirect pro consentimento do Google — a lógica em si vive no callback abaixo. */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get("google")
  iniciarLoginGoogle() {}

  /**
   * O Google chama esta rota via GET (redirect do navegador, não XHR) — por isso a resposta não é
   * JSON: seta o cookie de refresh igual ao login normal e redireciona pro front com o access token
   * na query string, que a página /entrar-google lê e joga pro AuthContext (ver apps/web).
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get("google/callback")
  async callbackGoogle(
    @CurrentUser() perfil: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const sessao = await this.authService.loginComGoogle(perfil as GooglePerfil, this.contexto(req));
    this.setRefreshCookie(res, sessao.refreshToken);
    const frontendUrl = (process.env.WEB_ORIGIN ?? "http://localhost:3001").split(",")[0].trim();
    res.redirect(`${frontendUrl}/entrar-google?accessToken=${encodeURIComponent(sessao.accessToken)}&expiraEm=${encodeURIComponent(sessao.expiraEm)}`);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const refreshTokenPlano = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    if (!refreshTokenPlano) {
      throw new RefreshTokenInvalidoException("Refresh token não informado.");
    }
    const sessao = await this.authService.refresh(refreshTokenPlano, this.contexto(req));
    this.setRefreshCookie(res, sessao.refreshToken);
    return sessao;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() _usuario: AuthenticatedUser,
  ): Promise<void> {
    const refreshTokenPlano = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    if (refreshTokenPlano) {
      await this.authService.logout(refreshTokenPlano);
    }
    res.clearCookie(REFRESH_COOKIE);
  }

  @Get("me")
  async meuPerfil(@CurrentUser() usuario: AuthenticatedUser) {
    const perfil = await this.authService.buscarPerfil(usuario.id);
    return this.usuarioMapper.toResponse(perfil);
  }

  @Patch("me")
  async atualizarPerfil(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: AtualizarPerfilDto) {
    const perfil = await this.authService.atualizarPerfil(usuario.id, dto);
    return this.usuarioMapper.toResponse(perfil);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Patch("me/email")
  async alterarEmail(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: AlterarEmailDto) {
    const perfil = await this.authService.alterarEmail(usuario.id, dto.novoEmail, dto.senhaAtual);
    return this.usuarioMapper.toResponse(perfil);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("me/senha")
  async alterarSenha(@CurrentUser() usuario: AuthenticatedUser, @Body() dto: AlterarSenhaDto): Promise<void> {
    await this.authService.alterarSenha(usuario.id, dto.senhaAtual, dto.novaSenha);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("me")
  async deletarConta(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: DeletarContaDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.deletarConta(usuario.id, dto.senhaAtual);
    res.clearCookie(REFRESH_COOKIE);
  }

  private setRefreshCookie(res: Response, refreshToken?: string) {
    if (!refreshToken) return;
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 90) * 24 * 60 * 60 * 1000,
    });
  }

  private contexto(req: Request) {
    return { ip: req.ip, userAgent: req.headers["user-agent"] };
  }
}
