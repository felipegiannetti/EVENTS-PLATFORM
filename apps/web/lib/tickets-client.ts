import type { EmitirIngressoInput, IngressoResponse } from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

export function listarIngressos(eventoId: string, token: string) {
  return apiFetch<IngressoResponse[]>(`/events/${eventoId}/ingressos`, {}, token);
}

export function emitirIngresso(
  eventoId: string,
  loteId: string,
  input: EmitirIngressoInput,
  token: string,
) {
  return apiFetch<IngressoResponse>(
    `/events/${eventoId}/lotes/${loteId}/ingressos`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}
