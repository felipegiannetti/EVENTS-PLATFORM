import type {
  CriarOfertaIndicacaoInput,
  CriarProgramaIndicacaoInput,
  OfertaIndicacaoPublicaResponse,
  OfertaIndicacaoResponse,
  PainelIndicacaoResponse,
  SolicitarConfirmacaoContaIndicacaoResponse,
  ConfirmarContaIndicacaoResponse,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

export function buscarPainelIndicacoes(token: string) {
  return apiFetch<PainelIndicacaoResponse>("/referrals/me", {}, token);
}

export function solicitarContaIndicacao(input: CriarProgramaIndicacaoInput, token: string) {
  return apiFetch<SolicitarConfirmacaoContaIndicacaoResponse>(
    "/referrals/me/conta",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function confirmarContaIndicacao(tokenConfirmacao: string) {
  return apiFetch<ConfirmarContaIndicacaoResponse>("/referrals/conta/confirmar", {
    method: "POST",
    body: JSON.stringify({ token: tokenConfirmacao }),
  });
}

export function criarOfertaIndicacao(input: CriarOfertaIndicacaoInput, token: string) {
  return apiFetch<OfertaIndicacaoResponse>(
    "/referrals/me/ofertas",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function editarOfertaIndicacao(ofertaId: string, input: CriarOfertaIndicacaoInput, token: string) {
  return apiFetch<OfertaIndicacaoResponse>(
    `/referrals/me/ofertas/${ofertaId}`,
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function removerOfertaIndicacao(ofertaId: string, token: string) {
  return apiFetch<{ removido: true }>(`/referrals/me/ofertas/${ofertaId}`, { method: "DELETE" }, token);
}

export function buscarOfertaIndicacao(codigo: string) {
  return apiFetch<OfertaIndicacaoPublicaResponse>(`/referrals/ofertas/${codigo}`);
}
