import type {
  AtualizarEventoInput,
  ConvidarAcessoInput,
  CriarEventoInput,
  CriarLinkVendaInput,
  CriarLoteInput,
  EventoResponse,
  LinkVendaResponse,
  LoteResponse,
  PapelAcessoResponse,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

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
