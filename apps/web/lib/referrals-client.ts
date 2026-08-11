import type {
  CriarOfertaIndicacaoInput,
  CriarProgramaIndicacaoInput,
  OfertaIndicacaoPublicaResponse,
  OfertaIndicacaoResponse,
  PainelIndicacaoResponse,
  ProgramaIndicacaoResponse,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

export function buscarPainelIndicacoes(token: string) {
  return apiFetch<PainelIndicacaoResponse>("/referrals/me", {}, token);
}

export function criarProgramaIndicacao(input: CriarProgramaIndicacaoInput, token: string) {
  return apiFetch<ProgramaIndicacaoResponse>(
    "/referrals/me",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function criarOfertaIndicacao(input: CriarOfertaIndicacaoInput, token: string) {
  return apiFetch<OfertaIndicacaoResponse>(
    "/referrals/me/ofertas",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function buscarOfertaIndicacao(codigo: string) {
  return apiFetch<OfertaIndicacaoPublicaResponse>(`/referrals/ofertas/${codigo}`);
}
