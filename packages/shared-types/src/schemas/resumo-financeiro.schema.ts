import { z } from "zod";

/**
 * Calculado a partir de Ingresso+Lote (preço do lote × ingressos não cancelados) — não depende
 * do checkout/pagamento, que ainda não existe. Por isso não tem "em processamento" ou "recebido":
 * esses só fazem sentido quando o dinheiro passar de fato por um gateway (ver
 * docs/architecture/09-modelo-financeiro.md) — mostrar um valor aqui seria inventar dado.
 */
export const resumoFinanceiroEventoSchema = z.object({
  vendasBrutas: z.number(),
  ticketMedioBruto: z.number(),
  ingressosValidos: z.number().int(),
  ingressosCancelados: z.number().int(),
});
export type ResumoFinanceiroEvento = z.infer<typeof resumoFinanceiroEventoSchema>;
