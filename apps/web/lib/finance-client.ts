import type {
  CadastrarContaBancariaInput,
  ContaBancariaResponse,
  ResumoFinanceiroEvento,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

export function buscarContaBancaria(eventoId: string, token: string) {
  return apiFetch<ContaBancariaResponse>(`/events/${eventoId}/conta-bancaria`, {}, token);
}

export function buscarResumoFinanceiro(eventoId: string, token: string) {
  return apiFetch<ResumoFinanceiroEvento>(`/events/${eventoId}/financeiro/resumo`, {}, token);
}

export function cadastrarContaBancaria(
  eventoId: string,
  input: CadastrarContaBancariaInput,
  token: string,
) {
  return apiFetch<ContaBancariaResponse>(
    `/events/${eventoId}/conta-bancaria`,
    { method: "PUT", body: JSON.stringify(input) },
    token,
  );
}
