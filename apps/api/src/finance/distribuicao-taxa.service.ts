import { ConflictException, Injectable } from "@nestjs/common";
import type { EscopoAcordoComercial } from "@events-platform/shared-types";
import { PrismaService } from "../infra/prisma/prisma.service";
import { calcularPartesProgramaIndicacao, TAXA_SERVICO_PERCENTUAL } from "./distribuicao-taxa.util";

export interface DistribuicaoTaxaEvento {
  percentualAcordoOrganizador: number;
  percentualBeneficioIndicacaoOrganizador: number;
  percentualIndicadorBase: number;
  percentualBonusIndicador: number;
  percentualTotalIndicador: number;
  percentualLiquidoPlataforma: number;
}

@Injectable()
export class DistribuicaoTaxaService {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(eventoId: string): Promise<DistribuicaoTaxaEvento> {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      select: {
        id: true,
        organizadorId: true,
        ingressos: {
          where: { status: { not: "cancelado" }, lote: { preco: { gt: 0 } } },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!evento?.organizadorId || evento.ingressos.length === 0) return this.semPrograma();

    const [indicacao, primeiroEventoPago, acordo] = await Promise.all([
      this.prisma.indicacao.findUnique({
        where: { indicadoId: evento.organizadorId },
        select: { percentualBeneficioOrganizador: true, primeiroEventoPagoId: true },
      }),
      this.prisma.evento.findFirst({
        where: {
          organizadorId: evento.organizadorId,
          ingressos: { some: { status: { not: "cancelado" }, lote: { preco: { gt: 0 } } } },
        },
        orderBy: [{ data: "asc" }, { id: "asc" }],
        select: { id: true },
      }),
      this.buscarAcordoAplicavel(eventoId, evento.organizadorId),
    ]);

    const primeiro = indicacao?.primeiroEventoPagoId
      ? indicacao.primeiroEventoPagoId === eventoId
      : primeiroEventoPago?.id === eventoId;
    const programa = calcularPartesProgramaIndicacao(
      indicacao ? Number(indicacao.percentualBeneficioOrganizador) : null,
      primeiro,
    );
    const percentualAcordoOrganizador = acordo ? Number(acordo.percentualOrganizador) : 0;
    const percentualLiquidoPlataforma =
      TAXA_SERVICO_PERCENTUAL -
      percentualAcordoOrganizador -
      programa.percentualBeneficioOrganizador -
      programa.percentualTotalIndicador;
    if (percentualLiquidoPlataforma < -0.0001) {
      throw new ConflictException("O acordo comercial e o programa de indicação ultrapassam os 12% disponíveis.");
    }
    return {
      percentualAcordoOrganizador,
      percentualBeneficioIndicacaoOrganizador: programa.percentualBeneficioOrganizador,
      percentualIndicadorBase: programa.percentualIndicadorBase,
      percentualBonusIndicador: programa.percentualBonusIndicador,
      percentualTotalIndicador: programa.percentualTotalIndicador,
      percentualLiquidoPlataforma: Math.max(0, percentualLiquidoPlataforma),
    };
  }

  private async buscarAcordoAplicavel(eventoId: string, organizadorId: string) {
    const acordos = await this.prisma.acordoComercial.findMany({
      where: { organizadorId, ativo: true },
      orderBy: { criadoEm: "desc" },
    });
    const especifico = acordos.find((acordo) => acordo.escopo === "evento_especifico" && acordo.eventoId === eventoId);
    if (especifico) return especifico;

    for (const acordo of acordos.filter((item) => item.escopo === "proximos_n_eventos")) {
      const eventos = await this.prisma.evento.findMany({
        where: {
          organizadorId,
          data: { gte: acordo.criadoEm },
          ingressos: { some: { status: { not: "cancelado" }, lote: { preco: { gt: 0 } } } },
        },
        orderBy: [{ data: "asc" }, { id: "asc" }],
        take: acordo.eventosRestantes ?? 0,
        select: { id: true },
      });
      if (eventos.some((evento) => evento.id === eventoId)) return acordo;
    }

    return acordos.find((acordo) => acordo.escopo === ("todos_eventos" satisfies EscopoAcordoComercial)) ?? null;
  }

  private semPrograma(): DistribuicaoTaxaEvento {
    return {
      percentualAcordoOrganizador: 0,
      percentualBeneficioIndicacaoOrganizador: 0,
      percentualIndicadorBase: 0,
      percentualBonusIndicador: 0,
      percentualTotalIndicador: 0,
      percentualLiquidoPlataforma: TAXA_SERVICO_PERCENTUAL,
    };
  }
}
