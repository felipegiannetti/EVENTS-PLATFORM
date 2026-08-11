import type {
  AcordoComercialResponse,
  CriarAcordoComercialInput,
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
