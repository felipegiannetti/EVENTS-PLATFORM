import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AcordoComercialResponse,
  CriarAcordoComercialInput,
  OrganizadorAdminResponse,
} from "@events-platform/shared-types";
import { PrismaService } from "../infra/prisma/prisma.service";
import { percentualMaximoAcordoAdmin, TAXA_SERVICO_PERCENTUAL } from "../finance/distribuicao-taxa.util";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listarOrganizadores(): Promise<OrganizadorAdminResponse[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { eventosOrganizados: { some: {} } },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        email: true,
        indicacaoRecebida: { select: { percentualBeneficioOrganizador: true } },
        eventosOrganizados: { orderBy: { data: "desc" }, select: { id: true, nome: true, data: true } },
        acordosComerciais: { orderBy: { criadoEm: "desc" } },
      },
    });
    return usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      indicado: Boolean(usuario.indicacaoRecebida),
      percentualBeneficioIndicacao: usuario.indicacaoRecebida
        ? Number(usuario.indicacaoRecebida.percentualBeneficioOrganizador)
        : 0,
      eventos: usuario.eventosOrganizados.map((evento) => ({ ...evento, data: evento.data.toISOString() })),
      acordos: usuario.acordosComerciais.map((acordo) => this.mapearAcordo(acordo)),
    }));
  }

  async criarAcordo(input: CriarAcordoComercialInput, adminId: string): Promise<AcordoComercialResponse> {
    const organizador = await this.prisma.usuario.findUnique({
      where: { id: input.organizadorId },
      select: {
        id: true,
        indicacaoRecebida: { select: { percentualBeneficioOrganizador: true } },
        eventosOrganizados: { select: { id: true } },
      },
    });
    if (!organizador || organizador.eventosOrganizados.length === 0) {
      throw new NotFoundException("Organizador não encontrado.");
    }
    if (input.escopo === "evento_especifico" && !organizador.eventosOrganizados.some((evento) => evento.id === input.eventoId)) {
      throw new BadRequestException("O evento selecionado não pertence a esse organizador.");
    }
    const beneficio = organizador.indicacaoRecebida
      ? Number(organizador.indicacaoRecebida.percentualBeneficioOrganizador)
      : null;
    const limite = percentualMaximoAcordoAdmin(beneficio);
    if (input.percentualOrganizador > limite) {
      throw new ConflictException(
        `Para este organizador, o máximo disponível ao acordo é ${limite.toLocaleString("pt-BR")}% dos 12%.`,
      );
    }

    const acordo = await this.prisma.$transaction(async (tx) => {
      await tx.acordoComercial.updateMany({
        where: { organizadorId: input.organizadorId, ativo: true },
        data: { ativo: false },
      });
      const criado = await tx.acordoComercial.create({
        data: {
          organizadorId: input.organizadorId,
          eventoId: input.escopo === "evento_especifico" ? input.eventoId : undefined,
          percentualOrganizador: input.percentualOrganizador,
          percentualNovyx: TAXA_SERVICO_PERCENTUAL - input.percentualOrganizador,
          escopo: input.escopo,
          eventosRestantes: input.escopo === "proximos_n_eventos" ? input.eventosRestantes : undefined,
          definidoPorAdminId: adminId,
        },
      });
      await tx.auditLog.create({
        data: { usuarioId: adminId, acao: "CRIAR_ACORDO_COMERCIAL", entidade: "AcordoComercial", entidadeId: criado.id },
      });
      return criado;
    });
    return this.mapearAcordo(acordo);
  }

  async desativarAcordo(id: string, adminId: string): Promise<AcordoComercialResponse> {
    const existente = await this.prisma.acordoComercial.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException("Acordo comercial não encontrado.");
    const acordo = await this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.acordoComercial.update({ where: { id }, data: { ativo: false } });
      await tx.auditLog.create({
        data: { usuarioId: adminId, acao: "DESATIVAR_ACORDO_COMERCIAL", entidade: "AcordoComercial", entidadeId: id },
      });
      return atualizado;
    });
    return this.mapearAcordo(acordo);
  }

  private mapearAcordo(acordo: {
    id: string;
    organizadorId: string;
    eventoId: string | null;
    percentualOrganizador: unknown;
    percentualNovyx: unknown;
    escopo: "todos_eventos" | "evento_especifico" | "proximos_n_eventos";
    eventosRestantes: number | null;
    ativo: boolean;
    criadoEm: Date;
  }): AcordoComercialResponse {
    return {
      id: acordo.id,
      organizadorId: acordo.organizadorId,
      eventoId: acordo.eventoId,
      percentualOrganizador: Number(acordo.percentualOrganizador),
      percentualNovyx: Number(acordo.percentualNovyx),
      escopo: acordo.escopo,
      eventosRestantes: acordo.eventosRestantes,
      ativo: acordo.ativo,
      criadoEm: acordo.criadoEm.toISOString(),
    };
  }
}
