import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AcordoComercialResponse,
  CriarAcordoComercialInput,
  CriarFeatureFlagInput,
  EventoAdminResponse,
  FeatureFlagResponse,
  FinanceiroAdminResponse,
  OrganizadorAdminResponse,
} from "@events-platform/shared-types";
import { PrismaService } from "../infra/prisma/prisma.service";
import { percentualMaximoAcordoAdmin, TAXA_SERVICO_PERCENTUAL } from "../finance/distribuicao-taxa.util";
import { FinanceService } from "../finance/finance.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

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

  /** Espaço de Suporte — busca evento de qualquer organizador por nome do evento ou do organizador. */
  async listarEventos(busca?: string): Promise<EventoAdminResponse[]> {
    const eventos = await this.prisma.evento.findMany({
      where: busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { organizador: { nome: { contains: busca, mode: "insensitive" } } },
              { organizador: { email: { contains: busca, mode: "insensitive" } } },
            ],
          }
        : undefined,
      orderBy: { data: "desc" },
      take: 50,
      select: {
        id: true,
        nome: true,
        data: true,
        cidade: true,
        estado: true,
        publicado: true,
        organizador: { select: { nome: true, email: true } },
      },
    });
    return eventos.map((evento) => ({
      id: evento.id,
      nome: evento.nome,
      organizadorNome: evento.organizador?.nome ?? null,
      organizadorEmail: evento.organizador?.email ?? null,
      data: evento.data.toISOString(),
      cidade: evento.cidade,
      estado: evento.estado,
      publicado: evento.publicado,
    }));
  }

  /** Espaço de Sistema — nenhuma dessas chaves é checada por nenhuma funcionalidade ainda, ver docs/architecture/11-roadmap.md. */
  async listarFeatureFlags(): Promise<FeatureFlagResponse[]> {
    const flags = await this.prisma.featureFlag.findMany({ orderBy: { chave: "asc" } });
    return flags.map((flag) => ({ ...flag, criadoEm: flag.criadoEm.toISOString() }));
  }

  async criarFeatureFlag(input: CriarFeatureFlagInput): Promise<FeatureFlagResponse> {
    const existente = await this.prisma.featureFlag.findUnique({ where: { chave: input.chave } });
    if (existente) {
      throw new ConflictException("Já existe uma funcionalidade cadastrada com essa chave.");
    }
    const flag = await this.prisma.featureFlag.create({ data: { chave: input.chave } });
    return { ...flag, criadoEm: flag.criadoEm.toISOString() };
  }

  async alternarFeatureFlag(id: string, adminId: string): Promise<FeatureFlagResponse> {
    const existente = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException("Funcionalidade não encontrada.");
    }
    const flag = await this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.featureFlag.update({ where: { id }, data: { ativo: !existente.ativo } });
      await tx.auditLog.create({
        data: {
          usuarioId: adminId,
          acao: atualizado.ativo ? "ATIVAR_FEATURE_FLAG" : "DESATIVAR_FEATURE_FLAG",
          entidade: "FeatureFlag",
          entidadeId: id,
        },
      });
      return atualizado;
    });
    return { ...flag, criadoEm: flag.criadoEm.toISOString() };
  }

  /**
   * Espaço Financeiro — consolidado entre todos os eventos com pelo menos um ingresso não cancelado,
   * reaproveitando FinanceService.buscarResumoFinanceiro (mesmo cálculo que o organizador já vê por
   * evento) em vez de reimplementar a distribuição de taxa. Sem paginação/lote por enquanto — tela
   * interna de admin, não uma rota de tráfego alto.
   */
  async buscarFinanceiro(): Promise<FinanceiroAdminResponse> {
    const eventos = await this.prisma.evento.findMany({
      where: { ingressos: { some: { status: { not: "cancelado" } } } },
      orderBy: { data: "desc" },
      select: { id: true, nome: true, data: true, organizador: { select: { nome: true } } },
    });

    const linhas = await Promise.all(
      eventos.map(async (evento) => {
        const resumo = await this.financeService.buscarResumoFinanceiro(evento.id);
        const taxaRetidaPlataforma = resumo.vendasBrutas - resumo.vendaLiquida - resumo.valorEstimadoIndicador;
        return {
          eventoId: evento.id,
          eventoNome: evento.nome,
          organizadorNome: evento.organizador?.nome ?? null,
          data: evento.data.toISOString(),
          vendasBrutas: resumo.vendasBrutas,
          taxaRetidaPlataforma,
          valorRepasseOrganizador: resumo.vendaLiquida,
          ingressosValidos: resumo.ingressosValidos,
        };
      }),
    );

    const totais = linhas.reduce(
      (acc, linha) => ({
        vendasBrutas: acc.vendasBrutas + linha.vendasBrutas,
        taxaRetidaPlataforma: acc.taxaRetidaPlataforma + linha.taxaRetidaPlataforma,
        valorRepasseOrganizador: acc.valorRepasseOrganizador + linha.valorRepasseOrganizador,
        totalEventos: acc.totalEventos + 1,
        totalIngressosValidos: acc.totalIngressosValidos + linha.ingressosValidos,
      }),
      { vendasBrutas: 0, taxaRetidaPlataforma: 0, valorRepasseOrganizador: 0, totalEventos: 0, totalIngressosValidos: 0 },
    );

    return { totais, eventos: linhas };
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
