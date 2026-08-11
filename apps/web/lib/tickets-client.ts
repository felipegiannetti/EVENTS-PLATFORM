import type { AtualizarIngressoInput, EmitirIngressoInput, IngressoResponse, LeituraCheckinResponse, MeuIngressoResponse } from "@events-platform/shared-types";
import { ApiError, apiFetch } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function listarIngressos(eventoId: string, token: string) {
  return apiFetch<IngressoResponse[]>(`/events/${eventoId}/ingressos`, {}, token);
}

export function listarMeusIngressos(token: string) {
  return apiFetch<MeuIngressoResponse[]>("/tickets/meus", {}, token);
}

/** Só inicia a transferência — o ingresso vai pra "aguardando_aceite", ainda não muda de dono. */
export function transferirIngresso(ticketId: string, destinatarioEmail: string, token: string) {
  return apiFetch<{ iniciada: true }>(
    `/tickets/${ticketId}/transferir`,
    { method: "POST", body: JSON.stringify({ destinatarioEmail }) },
    token,
  );
}

/** Remetente desiste antes do aceite — o ingresso volta pra carteira de quem enviou. */
export function cancelarTransferenciaIngresso(ticketId: string, token: string) {
  return apiFetch<{ cancelada: true }>(`/tickets/${ticketId}/transferir/cancelar`, { method: "POST" }, token);
}

export function listarTransferenciasRecebidas(token: string) {
  return apiFetch<MeuIngressoResponse[]>("/tickets/recebidas", {}, token);
}

export function aceitarTransferenciaIngresso(ticketId: string, token: string) {
  return apiFetch<IngressoResponse>(`/tickets/${ticketId}/aceitar`, { method: "POST" }, token);
}

export function recusarTransferenciaIngresso(ticketId: string, token: string) {
  return apiFetch<{ recusada: true }>(`/tickets/${ticketId}/recusar`, { method: "POST" }, token);
}

/** Cancelamento self-service (o próprio comprador cancela o próprio ingresso) — diferente do cancelamento feito pelo organizador em /events/:id/ingressos/:ticketId/status. */
export function cancelarIngressoProprio(ticketId: string, token: string) {
  return apiFetch<{ cancelado: true }>(`/tickets/${ticketId}/cancelar`, { method: "POST" }, token);
}

export function checkin(eventoId: string, qrToken: string, token: string) {
  return apiFetch<IngressoResponse>(
    `/events/${eventoId}/checkin`,
    { method: "POST", body: JSON.stringify({ qrToken }) },
    token,
  );
}

export function listarLeiturasCheckin(eventoId: string, token: string) {
  return apiFetch<LeituraCheckinResponse[]>(`/events/${eventoId}/checkin/leituras`, {}, token);
}

/** CSV precisa do Authorization header, então não dá pra ser um <a href> simples — baixa via fetch e dispara o download por um <a> temporário. */
export async function baixarParticipantesCsv(eventoId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/events/${eventoId}/participantes/csv`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error?.code ?? "ERRO_DESCONHECIDO", body?.error?.message ?? "Não foi possível exportar o CSV.");
  }
  const texto = await res.text();
  const blob = new Blob([texto], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `participantes-${eventoId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function enviarEmailParticipantes(eventoId: string, mensagem: string, token: string) {
  return apiFetch<{ enviadosPara: number }>(
    `/events/${eventoId}/participantes/email`,
    { method: "POST", body: JSON.stringify({ mensagem }) },
    token,
  );
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

export function atualizarIngresso(
  eventoId: string,
  ticketId: string,
  input: AtualizarIngressoInput,
  token: string,
) {
  return apiFetch<IngressoResponse>(
    `/events/${eventoId}/ingressos/${ticketId}`,
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function cancelarIngresso(eventoId: string, ticketId: string, token: string) {
  return apiFetch<IngressoResponse>(
    `/events/${eventoId}/ingressos/${ticketId}/status`,
    { method: "PATCH" },
    token,
  );
}

export function reenviarIngresso(eventoId: string, ticketId: string, token: string) {
  return apiFetch<{ enviado: boolean }>(
    `/events/${eventoId}/ingressos/${ticketId}/reenviar`,
    { method: "POST" },
    token,
  );
}
