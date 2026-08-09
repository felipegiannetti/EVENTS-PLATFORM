import { Inject, Injectable } from "@nestjs/common";
import type { CadastrarContaBancariaInput, ResumoFinanceiroEvento } from "@events-platform/shared-types";
import {
  CONTA_BANCARIA_REPOSITORY,
  type ContaBancariaRepository,
} from "./repository/conta-bancaria.repository";
import { ContaBancariaModel } from "./model/conta-bancaria.model";
import { ContaBancariaNaoEncontradaException } from "./exceptions/conta-bancaria-nao-encontrada.exception";
import { PrismaService } from "../infra/prisma/prisma.service";

/** Taxa fixa de serviço da NOVYX — ver docs/architecture/09-modelo-financeiro.md. Só muda por evento/organizador via um AcordoComercial ativo. */
const TAXA_SERVICO_PADRAO_PERCENTUAL = 12;

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
   *
   * A taxa de serviço é SEMPRE 12% do valor dos ingressos — fixa, não é o AcordoComercial que
   * muda esse total (ver docs/architecture/09-modelo-financeiro.md: "a NOVYX sempre retém 12%").
   * O que o AcordoComercial faz é dividir esses mesmos 12% entre NOVYX e organizador (ex: 8%/4%) —
   * nunca aumenta a taxa cobrada, só devolve uma fatia dela pro organizador como incentivo.
   * taxaPagaPor decide só ONDE a taxa sai: "comprador" = cobrada por fora, somada ao preço do
   * ingresso (vendasBrutas cresce pelo valor da taxa); "organizador" = descontada do valor do
   * ingresso (vendasBrutas é só o valor do ingresso). Em qualquer um dos dois casos, vendaLiquida
   * é sempre vendasBrutas menos a taxa que a NOVYX efetivamente retém (12% menos o que for
   * devolvido pelo acordo) — nunca fica igual a vendasBrutas, a não ser no caso extremo de um
   * acordo devolver a taxa inteira.
   */
  async buscarResumoFinanceiro(eventoId: string): Promise<ResumoFinanceiroEvento> {
    const [evento, ingressos] = await Promise.all([
      this.prisma.evento.findUnique({
        where: { id: eventoId },
        select: {
          taxaPagaPor: true,
          papeisAcesso: { where: { papel: "owner" }, select: { usuarioId: true }, take: 1 },
        },
      }),
      this.prisma.ingresso.findMany({
        where: { eventoId },
        select: { status: true, lote: { select: { preco: true } } },
      }),
    ]);

    const validos = ingressos.filter((ingresso) => ingresso.status !== "cancelado");
    const cancelados = ingressos.length - validos.length;
    const valorIngressos = validos.reduce((total, ingresso) => total + Number(ingresso.lote.preco), 0);

    const taxaPagaPor = evento?.taxaPagaPor ?? "comprador";
    const organizadorId = evento?.papeisAcesso[0]?.usuarioId;

    const acordo = organizadorId
      ? await this.prisma.acordoComercial.findFirst({
          where: {
            organizadorId,
            ativo: true,
            OR: [
              { escopo: "evento_especifico", eventoId },
              { escopo: "todos_eventos" },
            ],
          },
          orderBy: { criadoEm: "desc" },
        })
      : null;

    const percentualTaxaServico = TAXA_SERVICO_PADRAO_PERCENTUAL;
    const percentualDevolvidoAoOrganizador = acordo ? Number(acordo.percentualOrganizador) : 0;

    const taxaTotal = valorIngressos * (percentualTaxaServico / 100);
    const kickback = valorIngressos * (percentualDevolvidoAoOrganizador / 100);
    const taxaRetidaPelaNovyx = taxaTotal - kickback;

    const vendasBrutas = taxaPagaPor === "comprador" ? valorIngressos + taxaTotal : valorIngressos;
    const vendaLiquida = vendasBrutas - taxaRetidaPelaNovyx;
    const ticketMedioBruto = validos.length > 0 ? vendasBrutas / validos.length : 0;

    return {
      vendasBrutas,
      vendaLiquida,
      ticketMedioBruto,
      ingressosValidos: validos.length,
      ingressosCancelados: cancelados,
      percentualTaxaServico,
      percentualDevolvidoAoOrganizador,
      taxaPagaPor,
    };
  }
}
