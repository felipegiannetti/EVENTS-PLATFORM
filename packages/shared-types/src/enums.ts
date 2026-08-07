export const PAPEL_GLOBAL = ["usuario", "admin_geral"] as const;
export type PapelGlobal = (typeof PAPEL_GLOBAL)[number];

export const PAPEL_EVENTO = ["owner", "gestor", "view", "checkin_operator"] as const;
export type PapelEvento = (typeof PAPEL_EVENTO)[number];

export const STATUS_INGRESSO = ["valido", "usado", "cancelado"] as const;
export type StatusIngresso = (typeof STATUS_INGRESSO)[number];

export const TAXA_PAGA_POR = ["comprador", "organizador"] as const;
export type TaxaPagaPor = (typeof TAXA_PAGA_POR)[number];
