import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PapelEvento } from "@events-platform/shared-types";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EVENT_ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedRequest } from "../types/authenticated-request";

/**
 * Checa se o usuário autenticado tem um dos papéis exigidos (@EventRoles) para o evento da rota
 * (lido de :id ou :eventoId). Consulta o Prisma diretamente em vez de passar pelo PapelAcessoRepository
 * de events/ — evitaria uma dependência circular entre o módulo security (transversal, carregado antes
 * de qualquer feature) e o módulo events, e a consulta aqui é só leitura, sem regra de negócio.
 */
@Injectable()
export class EventRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<PapelEvento[]>(EVENT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Superusuário — admin_geral tem acesso equivalente a owner em qualquer evento, sem precisar
    // de um PapelAcesso próprio (usado pela área de Suporte do admin, entre outras).
    if (request.user.papelGlobal === "admin_geral") {
      return true;
    }

    const eventoId = (request.params.eventoId ?? request.params.id) as string | undefined;
    if (!eventoId) {
      throw new ForbiddenException("Rota sem eventoId para checar permissão.");
    }

    const papelAcesso = await this.prisma.papelAcesso.findUnique({
      where: { usuarioId_eventoId: { usuarioId: request.user.id, eventoId } },
    });

    if (!papelAcesso || !requiredRoles.includes(papelAcesso.papel as PapelEvento)) {
      throw new ForbiddenException("Você não tem permissão para este evento.");
    }
    return true;
  }
}
