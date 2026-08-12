import { z } from "zod";
import { TAXA_PAGA_POR } from "../enums";

/**
 * Calculado a partir de Ingresso+Lote (preço do lote × ingressos não cancelados) — não depende
 * do checkout/pagamento, que ainda não existe. Por isso não tem "em processamento" ou "recebido":
 * esses só fazem sentido quando o dinheiro passar de fato por um gateway (ver
 * docs/architecture/09-modelo-financeiro.md) — mostrar um valor aqui seria inventar dado.
 *
 * A NOVYX sempre retém percentualTaxaServico (12% fixo, não muda por acordo) de cima do valor dos
 * ingressos. taxaPagaPor só decide QUEM esse valor sai: "comprador" = cobrado por fora, somado ao
 * preço do ingresso (vendasBrutas já inclui esse acréscimo); "organizador" = descontado do valor
 * do ingresso (vendasBrutas é só o valor do ingresso). Em ambos os casos vendaLiquida < vendasBrutas
 * pela taxa retida — exceto se um AcordoComercial ativo devolver parte dela (percentualDevolvidoAoOrganizador,
 * configurado pelo admin geral por organizador, dividindo os mesmos 12% entre NOVYX e organizador —
 * nunca aumenta a taxa total cobrada, só quem fica com qual fatia dela). Ver docs/architecture/09-modelo-financeiro.md.
 */
export const resumoFinanceiroEventoSchema = z.object({
  vendasBrutas: z.number(),
  vendaLiquida: z.number(),
  ticketMedioBruto: z.number(),
  ingressosValidos: z.number().int(),
  ingressosCancelados: z.number().int(),
  percentualTaxaServico: z.number(),
  percentualDevolvidoAoOrganizador: z.number(),
  percentualBeneficioIndicacaoOrganizador: z.number(),
  percentualIndicadorBase: z.number(),
  percentualBonusIndicador: z.number(),
  percentualTotalIndicador: z.number(),
  percentualLiquidoPlataforma: z.number(),
  valorEstimadoIndicador: z.number(),
  valorBeneficioIndicacaoOrganizador: z.number(),
  taxaPagaPor: z.enum(TAXA_PAGA_POR),
  /** Soma do adicional fixo de R$0,49/ingresso (gateway) — só ingressos com lote.preco < R$50, 100% pra plataforma. */
  valorTaxaFixaGateway: z.number(),
  quantidadeComTaxaFixaGateway: z.number().int(),
});
export type ResumoFinanceiroEvento = z.infer<typeof resumoFinanceiroEventoSchema>;
