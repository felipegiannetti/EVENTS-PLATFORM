/**
 * Bancos aceitos no cadastro de conta de repasse — lista curada (código Febraban/COMPE + nome),
 * não texto livre. Isso já elimina "banco que não existe" por erro de digitação; a confirmação
 * de que a AGÊNCIA+CONTA específica existe naquele banco só é possível com uma integração
 * bancária/gateway real (Asaas, na fatia de checkout) — ver docs/architecture/09-modelo-financeiro.md.
 */
export interface BancoBrasil {
  codigo: string;
  nome: string;
}

export const BANCOS_BRASIL: BancoBrasil[] = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "033", nome: "Santander" },
  { codigo: "077", nome: "Banco Inter" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "121", nome: "Banco Agibank" },
  { codigo: "197", nome: "Stone Pagamentos" },
  { codigo: "208", nome: "BTG Pactual" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "290", nome: "PagBank (PagSeguro)" },
  { codigo: "323", nome: "Mercado Pago" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "341", nome: "Itaú" },
  { codigo: "380", nome: "PicPay" },
  { codigo: "422", nome: "Banco Safra" },
  { codigo: "623", nome: "Banco Pan" },
  { codigo: "655", nome: "Banco Votorantim (BV)" },
  { codigo: "735", nome: "Neon Pagamentos" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "756", nome: "Sicoob" },
] as const;

export const CODIGOS_BANCOS_BRASIL = BANCOS_BRASIL.map((b) => b.codigo) as [string, ...string[]];

export function nomeDoBanco(codigo: string): string {
  return BANCOS_BRASIL.find((b) => b.codigo === codigo)?.nome ?? codigo;
}
