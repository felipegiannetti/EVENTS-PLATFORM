import type {
  AtualizarListaOffGrupoInput,
  AtualizarPessoaListaOffInput,
  CriarListaOffGrupoInput,
  ImportarPessoasListaOffResponse,
  ListaOffGrupoResponse,
  PessoaListaOffResponse,
  PessoasListaOffPaginadas,
} from "@events-platform/shared-types";
import { apiFetch } from "./api-client";

const raiz = (eventoId: string) => `/events/${eventoId}/listas-off`;

export function listarListasOff(eventoId: string, token: string) {
  return apiFetch<ListaOffGrupoResponse[]>(raiz(eventoId), {}, token);
}

export function criarListaOff(eventoId: string, input: CriarListaOffGrupoInput, token: string) {
  return apiFetch<ListaOffGrupoResponse>(raiz(eventoId), { method: "POST", body: JSON.stringify(input) }, token);
}

export function atualizarListaOff(eventoId: string, listaId: string, input: AtualizarListaOffGrupoInput, token: string) {
  return apiFetch<ListaOffGrupoResponse>(`${raiz(eventoId)}/${listaId}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function removerListaOff(eventoId: string, listaId: string, token: string) {
  return apiFetch<void>(`${raiz(eventoId)}/${listaId}`, { method: "DELETE" }, token);
}

export function importarPessoasListaOff(eventoId: string, listaId: string, conteudo: string, token: string) {
  return apiFetch<ImportarPessoasListaOffResponse>(`${raiz(eventoId)}/${listaId}/pessoas/importar`, { method: "POST", body: JSON.stringify({ conteudo }) }, token);
}

export function listarPessoasListaOff(eventoId: string, listaId: string, filtros: { nome?: string; cpf?: string; pagina?: number; limite?: number }, token: string) {
  const query = new URLSearchParams();
  if (filtros.nome) query.set("nome", filtros.nome);
  if (filtros.cpf) query.set("cpf", filtros.cpf);
  query.set("pagina", String(filtros.pagina ?? 1));
  query.set("limite", String(filtros.limite ?? 20));
  return apiFetch<PessoasListaOffPaginadas>(`${raiz(eventoId)}/${listaId}/pessoas?${query}`, {}, token);
}

export function atualizarPessoaListaOff(eventoId: string, listaId: string, pessoaId: string, input: AtualizarPessoaListaOffInput, token: string) {
  return apiFetch<PessoaListaOffResponse>(`${raiz(eventoId)}/${listaId}/pessoas/${pessoaId}`, { method: "PATCH", body: JSON.stringify(input) }, token);
}

export function removerPessoaListaOff(eventoId: string, listaId: string, pessoaId: string, token: string) {
  return apiFetch<void>(`${raiz(eventoId)}/${listaId}/pessoas/${pessoaId}`, { method: "DELETE" }, token);
}

export function fazerCheckinListaOff(eventoId: string, listaId: string, pessoaId: string, token: string) {
  return apiFetch<PessoaListaOffResponse>(`${raiz(eventoId)}/${listaId}/pessoas/${pessoaId}/checkin`, { method: "POST" }, token);
}
