import type {
  AtualizarCupomDescontoInput,
  AtualizarEventoInput,
  ConvidarAcessoInput,
  CriarCupomDescontoInput,
  CriarEventoInput,
  CriarLinkVendaInput,
  CriarLoteInput,
  CupomDescontoResponse,
  EventoResponse,
  LinkVendaResponse,
  LoteResponse,
  PapelAcessoResponse,
} from "@events-platform/shared-types";
import { ApiError, apiFetch } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function listarEventos(token: string) {
  return apiFetch<EventoResponse[]>("/events", {}, token);
}

export function listarEventosPublicos() {
  return apiFetch<EventoResponse[]>("/events/public");
}

export function criarEvento(input: CriarEventoInput, token: string) {
  return apiFetch<EventoResponse>("/events", { method: "POST", body: JSON.stringify(input) }, token);
}

export function buscarEvento(id: string, token: string) {
  return apiFetch<EventoResponse>(`/events/${id}`, {}, token);
}

export function atualizarEvento(id: string, input: AtualizarEventoInput, token: string) {
  return apiFetch<EventoResponse>(
    `/events/${id}`,
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function listarLotes(eventoId: string, token: string) {
  return apiFetch<LoteResponse[]>(`/events/${eventoId}/lotes`, {}, token);
}

export function criarLote(eventoId: string, input: CriarLoteInput, token: string) {
  return apiFetch<LoteResponse>(
    `/events/${eventoId}/lotes`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function listarLinksVenda(eventoId: string, token: string) {
  return apiFetch<LinkVendaResponse[]>(`/events/${eventoId}/links-venda`, {}, token);
}

export function criarLinkVenda(eventoId: string, input: CriarLinkVendaInput, token: string) {
  return apiFetch<LinkVendaResponse>(
    `/events/${eventoId}/links-venda`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function listarAcessos(eventoId: string, token: string) {
  return apiFetch<PapelAcessoResponse[]>(`/events/${eventoId}/acesso`, {}, token);
}

export function convidarAcesso(eventoId: string, input: ConvidarAcessoInput, token: string) {
  return apiFetch<PapelAcessoResponse>(
    `/events/${eventoId}/acesso`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function removerAcesso(eventoId: string, usuarioId: string, token: string) {
  return apiFetch<void>(
    `/events/${eventoId}/acesso/${usuarioId}`,
    { method: "DELETE" },
    token,
  );
}

/** Banner salvo como bytes no banco — upload é multipart, então não usa apiFetch (que força JSON). */
export async function enviarBannerEvento(eventoId: string, arquivo: File, token: string): Promise<void> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  const res = await fetch(`${API_URL}/events/${eventoId}/banner`, {
    method: "PUT",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.error?.code ?? "ERRO_DESCONHECIDO",
      body?.error?.message ?? "Não foi possível enviar a imagem.",
    );
  }
}

export function urlBannerEvento(eventoId: string): string {
  return `${API_URL}/events/${eventoId}/banner`;
}

export function listarCupons(eventoId: string, token: string) {
  return apiFetch<CupomDescontoResponse[]>(`/events/${eventoId}/cupons`, {}, token);
}

export function criarCupom(eventoId: string, input: CriarCupomDescontoInput, token: string) {
  return apiFetch<CupomDescontoResponse>(
    `/events/${eventoId}/cupons`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export function atualizarCupom(
  eventoId: string,
  cupomId: string,
  input: AtualizarCupomDescontoInput,
  token: string,
) {
  return apiFetch<CupomDescontoResponse>(
    `/events/${eventoId}/cupons/${cupomId}`,
    { method: "PATCH", body: JSON.stringify(input) },
    token,
  );
}

export function removerCupom(eventoId: string, cupomId: string, token: string) {
  return apiFetch<void>(`/events/${eventoId}/cupons/${cupomId}`, { method: "DELETE" }, token);
}
