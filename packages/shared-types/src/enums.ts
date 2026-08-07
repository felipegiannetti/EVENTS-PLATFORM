export const PAPEL_GLOBAL = ["usuario", "admin_geral"] as const;
export type PapelGlobal = (typeof PAPEL_GLOBAL)[number];

export const PAPEL_EVENTO = ["owner", "gestor", "view", "checkin_operator"] as const;
export type PapelEvento = (typeof PAPEL_EVENTO)[number];

export const STATUS_INGRESSO = ["valido", "usado", "cancelado"] as const;
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
