import type { StatusIngresso } from "@events-platform/shared-types";

export const ROTULO_STATUS_INGRESSO: Record<StatusIngresso, string> = {
  pendente: "Pendente",
  valido: "Aprovado",
  usado: "Check-in feito",
  cancelado: "Cancelado",
};

/** Verde = aprovado (inclui check-in feito), amarelo = pagamento pendente, vermelho = cancelado. */
export const COR_STATUS_INGRESSO: Record<StatusIngresso, string> = {
  pendente: "bg-warning",
  valido: "bg-success",
  usado: "bg-success",
  cancelado: "bg-danger",
};
