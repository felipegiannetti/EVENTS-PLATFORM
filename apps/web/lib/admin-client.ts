import type {
  AcordoComercialResponse,
  CriarAcordoComercialInput,
  EventoAdminResponse,
  FeatureFlagResponse,
  FinanceiroAdminResponse,
  OrganizadorAdminResponse,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

export function listarOrganizadoresAdmin(token: string) {
  return apiFetch<OrganizadorAdminResponse[]>("/admin/organizadores", {}, token);
}

export function criarAcordoAdmin(input: CriarAcordoComercialInput, token: string) {
  return apiFetch<AcordoComercialResponse>(
    "/admin/acordos",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function desativarAcordoAdmin(acordoId: string, token: string) {
  return apiFetch<AcordoComercialResponse>(
    `/admin/acordos/${acordoId}/desativar`,
    { method: "PATCH", body: JSON.stringify({}) },
    token,
  );
}

/** Espaço de Suporte — busca evento de qualquer organizador (modo leitura, ver EventRoleGuard). */
export function buscarEventosAdmin(busca: string, token: string) {
  const query = busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : "";
  return apiFetch<EventoAdminResponse[]>(`/admin/eventos${query}`, {}, token);
}

/** Espaço de Sistema — nenhuma dessas chaves é checada por funcionalidade nenhuma ainda. */
export function listarFeatureFlags(token: string) {
  return apiFetch<FeatureFlagResponse[]>("/admin/feature-flags", {}, token);
}

export function criarFeatureFlag(chave: string, token: string) {
  return apiFetch<FeatureFlagResponse>(
    "/admin/feature-flags",
    { method: "POST", body: JSON.stringify({ chave }) },
    token,
  );
}

export function alternarFeatureFlag(id: string, token: string) {
  return apiFetch<FeatureFlagResponse>(`/admin/feature-flags/${id}/alternar`, { method: "PATCH" }, token);
}

/** Espaço Financeiro — consolidado entre todos os eventos, mesmo cálculo do financeiro por evento. */
export function buscarFinanceiroAdmin(token: string) {
  return apiFetch<FinanceiroAdminResponse>("/admin/financeiro", {}, token);
}
