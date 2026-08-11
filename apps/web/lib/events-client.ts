import type {
  AtualizarCupomDescontoInput,
  AtualizarEventoInput,
  ConvidarAcessoInput,
  CriarCupomDescontoInput,
  CriarEventoInput,
  CriarLinkVendaInput,
  CriarLoteInput,
  CupomDescontoResponse,
  CupomValidacaoPublicaResponse,
  EventoResponse,
  LinkVendaResponse,
  LoteResponse,
  PapelAcessoResponse,
  UsuarioAcessoSugestao,
} from "@events-platform/shared-types";
type AtualizarLoteInput = Partial<CriarLoteInput>;
import { ApiError, apiFetch } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function listarEventos(token: string) {
  return apiFetch<EventoResponse[]>("/events", {}, token);
}

export function listarEventosPublicos() {
  return apiFetch<EventoResponse[]>("/events/public");
}

export function buscarEventoPublico(id: string) {
  return apiFetch<EventoResponse>(`/events/public/${id}`);
}

export function validarCupomPublico(eventoId: string, codigo: string) {
  return apiFetch<CupomValidacaoPublicaResponse>(`/events/public/${eventoId}/cupom/${encodeURIComponent(codigo)}`);
}

/** Cupom especial: confirma a senha e recebe de volta a mesma forma já com tipo/valor revelados. */
export function desbloquearCupomPublico(eventoId: string, codigo: string, senha: string) {
  return apiFetch<CupomValidacaoPublicaResponse>(
    `/events/public/${eventoId}/cupom/${encodeURIComponent(codigo)}/desbloquear`,
    { method: "POST", body: JSON.stringify({ senha }) },
  );
}

export function urlPublicaEvento(eventoId: string, origin: string, cupom?: string): string {
  const url = `${origin}/e/${eventoId}`;
  return cupom ? `${url}?cupom=${encodeURIComponent(cupom)}` : url;
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

export function atualizarLote(eventoId: string, loteId: string, input: AtualizarLoteInput, token: string) {
  return apiFetch<LoteResponse>(
    `/events/${eventoId}/lotes/${loteId}`,
    { method: "PATCH", body: JSON.stringify(input) },
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

export function buscarUsuariosParaAcesso(eventoId: string, busca: string, token: string) {
  return apiFetch<UsuarioAcessoSugestao[]>(
    `/events/${eventoId}/acesso/usuarios?busca=${encodeURIComponent(busca)}`,
    {},
    token,
  );
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
