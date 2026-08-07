import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
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
  @Post("register")
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const usuario = await this.authService.registrar(dto.nome, dto.email, dto.senha);
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
