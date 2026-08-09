/**
 * API pública do IBGE (localidades) — sem chave, sem custo, é a fonte oficial de estados/cidades
 * do Brasil. Usada só no formulário de criar evento (estado → cidade dependentes). Se um dia isso
 * ficar instável, dá pra cachear a lista de estados (só 27, muda nunca) num arquivo estático —
 * as cidades por estado já não valem a pena cachear (mais de 5 mil municípios ao todo).
 */
const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export interface EstadoIbge {
  sigla: string;
  nome: string;
}

// Cache em memória (dura a sessão da aba) — estados nunca mudam, e é comum a mesma UF ser
// consultada de novo (ex: abrir "Configurações" já popula o estado atual do evento, depois o
// usuário troca de tela e volta). Sem isso, cada visita refazia a chamada à API externa do IBGE.
let cacheEstados: EstadoIbge[] | null = null;
const cacheCidadesPorUf = new Map<string, string[]>();

export async function listarEstadosBrasil(): Promise<EstadoIbge[]> {
  if (cacheEstados) return cacheEstados;
  const res = await fetch(`${IBGE_BASE_URL}/estados?orderBy=nome`);
  if (!res.ok) throw new Error("Não foi possível carregar a lista de estados.");
  const dados: { sigla: string; nome: string }[] = await res.json();
  cacheEstados = dados.map((estado) => ({ sigla: estado.sigla, nome: estado.nome }));
  return cacheEstados;
}

export async function listarCidadesPorEstado(siglaUf: string): Promise<string[]> {
  const emCache = cacheCidadesPorUf.get(siglaUf);
  if (emCache) return emCache;
  const res = await fetch(`${IBGE_BASE_URL}/estados/${siglaUf}/municipios`);
  if (!res.ok) throw new Error("Não foi possível carregar a lista de cidades.");
  const dados: { nome: string }[] = await res.json();
  const cidades = dados.map((cidade) => cidade.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
  cacheCidadesPorUf.set(siglaUf, cidades);
  return cidades;
}
