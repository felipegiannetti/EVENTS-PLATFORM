"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ClipboardList, Clock3, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import type { ListaOffGrupoResponse, PessoaListaOffResponse, PessoasListaOffPaginadas } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { formatarCpf } from "@/lib/formatters";
import { ApiError } from "@/lib/api-client";
import {
  atualizarListaOff,
  atualizarPessoaListaOff,
  criarListaOff,
  importarPessoasListaOff,
  listarListasOff,
  listarPessoasListaOff,
  removerListaOff,
  removerPessoaListaOff,
} from "@/lib/guestlist-client";

export default function ListaOffPage() {
  return <ProtectedPage>{(token) => <GestaoListaOff token={token} />}</ProtectedPage>;
}

function GestaoListaOff({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [listas, setListas] = useState<ListaOffGrupoResponse[]>([]);
  const [listaId, setListaId] = useState("");
  const [pessoas, setPessoas] = useState<PessoasListaOffPaginadas | null>(null);
  const [nomeLista, setNomeLista] = useState("");
  const [entradaAte, setEntradaAte] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [buscaCpf, setBuscaCpf] = useState("");
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvandoLista, setSalvandoLista] = useState(false);
  const [importando, setImportando] = useState(false);
  const [listaEditando, setListaEditando] = useState<ListaOffGrupoResponse | null>(null);
  const [pessoaEditando, setPessoaEditando] = useState<PessoaListaOffResponse | null>(null);

  const listaSelecionada = listas.find((lista) => lista.id === listaId) ?? null;

  async function carregarListas(preferida?: string) {
    const atuais = await listarListasOff(id, token);
    setListas(atuais);
    const proxima = preferida && atuais.some((lista) => lista.id === preferida)
      ? preferida
      : atuais.some((lista) => lista.id === listaId) ? listaId : (atuais[0]?.id ?? "");
    setListaId(proxima);
  }

  async function carregarPessoas(paginaDesejada = pagina) {
    if (!listaId) {
      setPessoas(null);
      return;
    }
    setPessoas(await listarPessoasListaOff(id, listaId, { nome: buscaNome, cpf: buscaCpf, pagina: paginaDesejada, limite: 20 }, token));
  }

  useEffect(() => {
    carregarListas().catch((err) => setErro(mensagemErro(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    carregarPessoas().catch((err) => setErro(mensagemErro(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaId, pagina]);

  async function criarLista(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvandoLista(true);
    try {
      const criada = await criarListaOff(id, { nome: nomeLista, entradaAte: entradaAte ? new Date(entradaAte).toISOString() : null }, token);
      setNomeLista("");
      setEntradaAte("");
      await carregarListas(criada.id);
      setSucesso("Lista criada. Agora você pode adicionar os nomes.");
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setSalvandoLista(false);
    }
  }

  async function importarPessoas(e: FormEvent) {
    e.preventDefault();
    if (!listaId) return;
    setErro(null);
    setSucesso(null);
    setImportando(true);
    try {
      const resultado = await importarPessoasListaOff(id, listaId, conteudo, token);
      setConteudo("");
      setPagina(1);
      await Promise.all([carregarListas(listaId), carregarPessoas(1)]);
      setSucesso(`${resultado.adicionadas} pessoa(s) adicionada(s) à lista.`);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setImportando(false);
    }
  }

  async function excluirLista(lista: ListaOffGrupoResponse) {
    if (!window.confirm(`Remover a lista “${lista.nome}” e todas as pessoas nela?`)) return;
    try {
      await removerListaOff(id, lista.id, token);
      await carregarListas();
      setSucesso("Lista removida.");
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }

  async function excluirPessoa(pessoa: PessoaListaOffResponse) {
    if (!listaId || !window.confirm(`Remover ${pessoa.nomeCompleto} desta lista?`)) return;
    try {
      await removerPessoaListaOff(id, listaId, pessoa.id, token);
      await Promise.all([carregarListas(listaId), carregarPessoas()]);
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    setPagina(1);
    carregarPessoas(1).catch((err) => setErro(mensagemErro(err)));
  }

  return (
    <main className="page-shell max-w-6xl">
      <span className="eyebrow"><ClipboardList size={12} /> Lista off</span>
      <h1 className="page-title">Listas de convidados</h1>
      <p className="page-description">Crie as listas primeiro e depois adicione uma ou várias pessoas no formato NOME COMPLETO, CPF.</p>

      {erro && <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{erro}</div>}
      {sucesso && <div className="mt-5 flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success"><CheckCircle2 size={16} />{sucesso}</div>}

      <Card className="mt-8 p-6">
        <h2 className="section-title !text-base">Criar uma lista</h2>
        <form onSubmit={criarLista} className="mt-4 grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input id="nomeLista" label="Nome da lista" required placeholder="Ex.: Convidados até 22h" value={nomeLista} onChange={(e) => setNomeLista(e.target.value)} />
          <Input id="entradaAte" label="Entrada permitida até (opcional)" type="datetime-local" value={entradaAte} onChange={(e) => setEntradaAte(e.target.value)} />
          <Button type="submit" variant="secondary" loading={salvandoLista}><Plus size={16} /> Criar lista</Button>
        </form>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit p-3">
          <div className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-muted">Suas listas</div>
          {listas.length === 0 ? (
            <p className="px-2 py-5 text-sm text-muted">Nenhuma lista criada.</p>
          ) : listas.map((lista) => (
            <div key={lista.id} className={`mb-1 rounded-xl border p-3 transition-colors ${lista.id === listaId ? "border-primary/25 bg-primary/5" : "border-transparent hover:bg-background/60"}`}>
              <button type="button" onClick={() => { setListaId(lista.id); setPagina(1); }} className="w-full text-left">
                <p className="font-semibold text-foreground">{lista.nome}</p>
                <p className="mt-1 text-xs text-muted">{lista.totalCheckins}/{lista.totalPessoas} check-ins</p>
                {lista.entradaAte && <p className="mt-1 flex items-center gap-1 text-xs text-warning"><Clock3 size={12} /> Até {formatarData(lista.entradaAte)}</p>}
              </button>
              <div className="mt-2 flex justify-end gap-1">
                <button type="button" aria-label="Editar lista" onClick={() => setListaEditando(lista)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary"><Pencil size={14} /></button>
                <button type="button" aria-label="Remover lista" onClick={() => excluirLista(lista)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </Card>

        <div>
          {!listaSelecionada ? (
            <Card className="p-10 text-center text-sm text-muted">Crie uma lista para começar.</Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="eyebrow">Adicionar convidados</p><h2 className="mt-2 text-xl font-bold">{listaSelecionada.nome}</h2></div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Users size={13} className="mr-1 inline" />{listaSelecionada.totalPessoas} pessoa(s)</span>
                </div>
                <form onSubmit={importarPessoas} className="mt-5">
                  <label htmlFor="pessoasLista" className="text-sm font-semibold text-foreground/80">Uma pessoa por linha</label>
                  <textarea id="pessoasLista" required rows={7} value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder={"Maria da Silva, 111.444.777-35\nJoão Souza, 52998224725"} className="mt-2 w-full rounded-xl border border-border/15 bg-background/60 p-4 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted">Aceita CPF com pontos e hífen ou apenas os 11 números.</p>
                    <Button type="submit" loading={importando}>Adicionar à lista</Button>
                  </div>
                </form>
              </Card>

              <Card className="mt-5 p-6">
                <h2 className="section-title !text-base">Pessoas cadastradas</h2>
                <form onSubmit={pesquisar} className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_220px_auto]">
                  <Input id="buscaNomeGestao" label="Pesquisar nome" placeholder="Nome completo" value={buscaNome} onChange={(e) => setBuscaNome(e.target.value)} />
                  <Input id="buscaCpfGestao" label="Pesquisar CPF" inputMode="numeric" placeholder="000.000.000-00" value={buscaCpf} onChange={(e) => setBuscaCpf(formatarCpf(e.target.value))} />
                  <Button type="submit" variant="secondary"><Search size={16} /> Buscar</Button>
                </form>
                <div className="mt-5 overflow-hidden rounded-xl border border-border/10">
                  {!pessoas ? <p className="p-5 text-sm text-muted">Carregando...</p> : pessoas.itens.length === 0 ? <p className="p-5 text-sm text-muted">Nenhuma pessoa encontrada.</p> : pessoas.itens.map((pessoa) => (
                    <div key={pessoa.id} className="flex flex-wrap items-center gap-3 border-b border-border/10 px-4 py-3 last:border-b-0">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pessoa.nomeCompleto}</p><p className="text-xs text-muted">{pessoa.cpf}</p></div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${pessoa.statusUso ? "bg-success/10 text-success" : "bg-background text-muted"}`}>{pessoa.statusUso ? "Check-in feito" : "Aguardando"}</span>
                      <button type="button" aria-label="Editar pessoa" onClick={() => setPessoaEditando(pessoa)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary"><Pencil size={15} /></button>
                      <button type="button" aria-label="Remover pessoa" onClick={() => excluirPessoa(pessoa)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
                {pessoas && <Pagination pagina={Math.min(pagina, pessoas.totalPaginas)} totalPaginas={pessoas.totalPaginas} onMudarPagina={setPagina} />}
              </Card>
            </>
          )}
        </div>
      </div>

      {listaEditando && <ModalEditarLista eventoId={id} token={token} lista={listaEditando} onFechar={() => setListaEditando(null)} onSalvo={async () => { setListaEditando(null); await carregarListas(listaEditando.id); }} />}
      {pessoaEditando && listaId && <ModalEditarPessoa eventoId={id} listaId={listaId} token={token} pessoa={pessoaEditando} onFechar={() => setPessoaEditando(null)} onSalvo={async () => { setPessoaEditando(null); await carregarPessoas(); }} />}
    </main>
  );
}

function ModalEditarLista({ eventoId, token, lista, onFechar, onSalvo }: { eventoId: string; token: string; lista: ListaOffGrupoResponse; onFechar: () => void; onSalvo: () => Promise<void> }) {
  const [nome, setNome] = useState(lista.nome);
  const [entradaAte, setEntradaAte] = useState(lista.entradaAte ? paraDataLocal(lista.entradaAte) : "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar(e: FormEvent) { e.preventDefault(); setSalvando(true); setErro(null); try { await atualizarListaOff(eventoId, lista.id, { nome, entradaAte: entradaAte ? new Date(entradaAte).toISOString() : null }, token); await onSalvo(); } catch (err) { setErro(mensagemErro(err)); } finally { setSalvando(false); } }
  return <Modal titulo="Editar lista" onFechar={onFechar}><form onSubmit={salvar} className="space-y-4"><Input id="editarNomeLista" label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} /><Input id="editarEntradaAte" label="Entrada permitida até (opcional)" type="datetime-local" value={entradaAte} onChange={(e) => setEntradaAte(e.target.value)} />{erro && <p className="text-sm text-danger">{erro}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onFechar}>Cancelar</Button><Button type="submit" loading={salvando}>Salvar</Button></div></form></Modal>;
}

function ModalEditarPessoa({ eventoId, listaId, token, pessoa, onFechar, onSalvo }: { eventoId: string; listaId: string; token: string; pessoa: PessoaListaOffResponse; onFechar: () => void; onSalvo: () => Promise<void> }) {
  const [nome, setNome] = useState(pessoa.nomeCompleto);
  const [cpf, setCpf] = useState(pessoa.cpf);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar(e: FormEvent) { e.preventDefault(); setSalvando(true); setErro(null); try { await atualizarPessoaListaOff(eventoId, listaId, pessoa.id, { nomeCompleto: nome, cpf }, token); await onSalvo(); } catch (err) { setErro(mensagemErro(err)); } finally { setSalvando(false); } }
  return <Modal titulo="Editar pessoa" onFechar={onFechar}><form onSubmit={salvar} className="space-y-4"><Input id="editarNomePessoa" label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} /><Input id="editarCpfPessoa" label="CPF" required inputMode="numeric" value={cpf} onChange={(e) => setCpf(formatarCpf(e.target.value))} />{erro && <p className="text-sm text-danger">{erro}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onFechar}>Cancelar</Button><Button type="submit" loading={salvando}>Salvar</Button></div></form></Modal>;
}

function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true"><Card className="w-full max-w-lg p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{titulo}</h2><button type="button" aria-label="Fechar" onClick={onFechar} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-background"><X size={17} /></button></div>{children}</Card></div>;
}

function mensagemErro(err: unknown) { return err instanceof ApiError ? err.message : "Não foi possível concluir a operação."; }
function formatarData(valor: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)); }
function paraDataLocal(valor: string) { const data = new Date(valor); const deslocamento = data.getTimezoneOffset() * 60_000; return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16); }
