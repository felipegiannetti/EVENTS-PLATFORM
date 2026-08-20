import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EmailNaoConfirmadoException } from "../../auth/exceptions/email-nao-confirmado.exception";
import type { AuthenticatedRequest } from "../types/authenticated-request";

/**
 * Gate obrigatório de confirmação de email — aplicado só nas ações financeiramente sensíveis que
 * já existem hoje (criar evento, cadastrar conta de repasse). Lê direto do banco (não do JWT) pra
 * valer na hora: confirmar o email não deveria exigir logout/login de novo pra destravar.
 */
@Injectable()
export class EmailConfirmadoGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: request.user.id },
      select: { emailConfirmado: true },
    });
    if (!usuario || !usuario.emailConfirmado) {
      throw new EmailNaoConfirmadoException();
    }
    return true;
  }
}
