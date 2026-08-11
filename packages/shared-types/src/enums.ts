export const PAPEL_GLOBAL = ["usuario", "admin_geral"] as const;
export type PapelGlobal = (typeof PAPEL_GLOBAL)[number];

export const PAPEL_EVENTO = ["owner", "gestor", "view", "checkin_operator"] as const;
export type PapelEvento = (typeof PAPEL_EVENTO)[number];

/**
 * "pendente" ainda não é produzido por nenhum fluxo (não existe checkout/pagamento assíncrono) —
 * existe só pra a UI (tela de Participantes) já estar pronta pra quando o gateway de pagamento entrar.
 * "aguardando_aceite" é diferente: já é produzido hoje — transferência iniciada mas o destinatário
 * ainda não aceitou (não pode ser usado no check-in nem cancelado via self-service nesse meio-tempo).
 */
export const STATUS_INGRESSO = ["pendente", "valido", "usado", "cancelado", "aguardando_aceite"] as const;
export type StatusIngresso = (typeof STATUS_INGRESSO)[number];

export const TAXA_PAGA_POR = ["comprador", "organizador"] as const;
export type TaxaPagaPor = (typeof TAXA_PAGA_POR)[number];

export const CATEGORIA_EVENTO = [
  "shows",
  "festivais",
  "negocios",
  "esportes",
  "cursos",
  "tecnologia",
  "outros",
] as const;
export type CategoriaEvento = (typeof CATEGORIA_EVENTO)[number];

export const ROTULO_CATEGORIA_EVENTO: Record<CategoriaEvento, string> = {
  shows: "Shows",
  festivais: "Festivais",
  negocios: "Negócios",
  esportes: "Esportes",
  cursos: "Cursos",
  tecnologia: "Tecnologia",
  outros: "Outros",
};

export const TIPO_CONTA_BANCARIA = ["corrente", "poupanca"] as const;
export type TipoContaBancaria = (typeof TIPO_CONTA_BANCARIA)[number];

export const TIPO_PESSOA = ["fisica", "juridica"] as const;
export type TipoPessoa = (typeof TIPO_PESSOA)[number];

export const TIPO_DESCONTO_CUPOM = ["percentual", "valor_fixo"] as const;
export type TipoDescontoCupom = (typeof TIPO_DESCONTO_CUPOM)[number];
