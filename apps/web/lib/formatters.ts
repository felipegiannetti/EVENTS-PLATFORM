import type { TipoPessoa } from "@events-platform/shared-types";

/** Máscara progressiva — aplicada a cada tecla digitada, não só na validação final. */
export function formatarCpf(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCnpj(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatarDocumento(valor: string, tipoPessoa: TipoPessoa): string {
  return tipoPessoa === "fisica" ? formatarCpf(valor) : formatarCnpj(valor);
}

/** Pra campos sem seletor de PF/PJ (ex: titular da conta de repasse) — troca de máscara sozinho ao passar de 11 dígitos. */
export function formatarCpfOuCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length > 11 ? formatarCnpj(valor) : formatarCpf(valor);
}

export function formatarAgencia(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 6);
}

export function formatarContaComDigito(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 13);
  if (digitos.length < 2) return digitos;
  return `${digitos.slice(0, -1)}-${digitos.slice(-1)}`;
}

/** (11) 90000-0000 fixo, ou (11) 0000-0000 se digitar só 10 dígitos (fixo sem o 9). */
export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digitos.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function formatarCep(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

/** Formata centavos (inteiro) como "R$ 1.234,56" — usado nos campos de preço mascarados. */
export function formatarCentavosComoReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
