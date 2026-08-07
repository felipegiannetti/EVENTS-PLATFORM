import { Inject, Injectable } from "@nestjs/common";
import type { CadastrarContaBancariaInput, ResumoFinanceiroEvento } from "@events-platform/shared-types";
import {
  CONTA_BANCARIA_REPOSITORY,
  type ContaBancariaRepository,
} from "./repository/conta-bancaria.repository";
import { ContaBancariaModel } from "./model/conta-bancaria.model";
import { ContaBancariaNaoEncontradaException } from "./exceptions/conta-bancaria-nao-encontrada.exception";
import { PrismaService } from "../infra/prisma/prisma.service";

@Injectable()
export class FinanceService {
  constructor(
    @Inject(CONTA_BANCARIA_REPOSITORY)
    private readonly contaBancariaRepository: ContaBancariaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async cadastrarContaBancaria(
    eventoId: string,
    input: CadastrarContaBancariaInput,
  ): Promise<ContaBancariaModel> {
    return this.contaBancariaRepository.upsert({ eventoId, ...input });
  }

  async buscarContaBancaria(eventoId: string): Promise<ContaBancariaModel> {
    const conta = await this.contaBancariaRepository.buscarPorEvento(eventoId);
    if (!conta) {
      throw new ContaBancariaNaoEncontradaException();
    }
    return conta;
  }

  /**
   * Calculado direto de Ingresso+Lote (preço do lote × ingressos não cancelados) — não é uma
   * entidade persistida, então não passa por Model/Repository, só uma leitura agregada (mesmo
   * racional do EventRoleGuard consultando o Prisma direto para uma leitura transversal).
   * Sem "em processamento"/"recebido" de propósito — isso só existe de verdade quando o checkout
   * (Asaas) entrar; ver docs/architecture/09-modelo-financeiro.md.
   */
  async buscarResumoFinanceiro(eventoId: string): Promise<ResumoFinanceiroEvento> {
    const ingressos = await this.prisma.ingresso.findMany({
      where: { eventoId },
      select: { status: true, lote: { select: { preco: true } } },
    });

    const validos = ingressos.filter((ingresso) => ingresso.status !== "cancelado");
    const cancelados = ingressos.length - validos.length;
    const vendasBrutas = validos.reduce((total, ingresso) => total + Number(ingresso.lote.preco), 0);
    const ticketMedioBruto = validos.length > 0 ? vendasBrutas / validos.length : 0;

    return {
      vendasBrutas,
      ticketMedioBruto,
      ingressosValidos: validos.length,
      ingressosCancelados: cancelados,
    };
  }
}
