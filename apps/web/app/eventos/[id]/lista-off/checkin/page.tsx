"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Check, CheckCircle2, Clock3, Search, UserCheck } from "lucide-react";
import type { ListaOffGrupoResponse, PessoasListaOffPaginadas } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { formatarCpf } from "@/lib/formatters";
import { fazerCheckinListaOff, listarListasOff, listarPessoasListaOff } from "@/lib/guestlist-client";

const POR_PAGINA = 15;

export default function CheckinListaOffPage() {
  return <ProtectedPage>{(token) => <CheckinListaOff token={token} />}</ProtectedPage>;
}

function CheckinListaOff({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [listas, setListas] = useState<ListaOffGrupoResponse[]>([]);
  const [listaId, setListaId] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [pagina, setPagina] = useState(1);
  const [pessoas, setPessoas] = useState<PessoasListaOffPaginadas | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const lista = listas.find((item) => item.id === listaId) ?? null;

  async function carregarListas() {
    const atuais = await listarListasOff(id, token);
    setListas(atuais);
    setListaId((atual) => atuais.some((item) => item.id === atual) ? atual : (atuais[0]?.id ?? ""));
  }

  async function carregarPessoas(paginaDesejada = pagina) {
    if (!listaId) { setPessoas(null); return; }
    setPessoas(await listarPessoasListaOff(id, listaId, { nome, cpf, pagina: paginaDesejada, limite: POR_PAGINA }, token));
  }

  useEffect(() => {
    carregarListas().catch((err) => setErro(mensagemErro(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    carregarPessoas().catch((err) => setErro(mensagemErro(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaId, pagina]);

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    setPagina(1);
    carregarPessoas(1).catch((err) => setErro(mensagemErro(err)));
  }

  async function confirmarCheckin(pessoaId: string, nomeCompleto: string) {
    setErro(null);
    setSucesso(null);
    setProcessandoId(pessoaId);
    try {
      await fazerCheckinListaOff(id, listaId, pessoaId, token);
      await Promise.all([carregarPessoas(), carregarListas()]);
      setSucesso(`Entrada confirmada para ${nomeCompleto}.`);
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow"><UserCheck size={12} /> Check-in lista off</span>
      <h1 className="page-title">Entrada de convidados</h1>
      <p className="page-description">Escolha a lista e pesquise nome e CPF em campos separados antes de confirmar a entrada.</p>

      {erro && <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{erro}</div>}
      {sucesso && <div className="mt-5 flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success"><CheckCircle2 size={16} />{sucesso}</div>}

      <Card className="mt-8 p-6">
        <form onSubmit={pesquisar} className="grid items-end gap-3 md:grid-cols-[1fr_1fr_220px_auto]">
          <Select id="listaCheckin" label="Lista" value={listaId} onChange={(e) => { setListaId(e.target.value); setPagina(1); }} disabled={listas.length === 0}>
            {listas.length === 0 ? <option value="">Nenhuma lista criada</option> : listas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </Select>
          <Input id="nomeCheckinLista" label="Nome" placeholder="Pesquisar pelo nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input id="cpfCheckinLista" label="CPF" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatarCpf(e.target.value))} />
          <Button type="submit" disabled={!listaId}><Search size={16} /> Pesquisar</Button>
        </form>
      </Card>

      {lista && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/10 bg-card/70 px-5 py-4">
          <div><p className="font-semibold">{lista.nome}</p><p className="text-xs text-muted">{lista.totalCheckins} de {lista.totalPessoas} entradas realizadas</p></div>
          {lista.entradaAte ? <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${new Date(lista.entradaAte).getTime() < Date.now() ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}><Clock3 size={13} />Entrada até {formatarData(lista.entradaAte)}</span> : <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Sem horário limite</span>}
        </div>
      )}

      <Card className="mt-5 overflow-hidden p-0">
        {!listaId ? (
          <p className="p-8 text-center text-sm text-muted">Crie uma lista antes de iniciar o check-in.</p>
        ) : !pessoas ? (
          <p className="p-8 text-center text-sm text-muted">Carregando...</p>
        ) : pessoas.itens.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nenhum convidado encontrado com esses filtros.</p>
        ) : (
          <div>
            {pessoas.itens.map((pessoa) => (
              <div key={pessoa.id} className="flex flex-col gap-3 border-b border-border/10 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{pessoa.nomeCompleto}</p><p className="mt-0.5 text-sm text-muted">{pessoa.cpf}</p></div>
                {pessoa.statusUso ? (
                  <div className="text-right"><span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success"><Check size={14} /> Check-in feito</span>{pessoa.usadoEm && <p className="mt-1 text-[11px] text-muted">{formatarData(pessoa.usadoEm)}</p>}</div>
                ) : (
                  <Button type="button" variant="secondary" loading={processandoId === pessoa.id} disabled={processandoId !== null} onClick={() => confirmarCheckin(pessoa.id, pessoa.nomeCompleto)}><UserCheck size={16} /> Confirmar entrada</Button>
                )}
              </div>
            ))}
          </div>
        )}
        {pessoas && pessoas.totalPaginas > 1 && <div className="px-5 pb-5"><Pagination pagina={Math.min(pagina, pessoas.totalPaginas)} totalPaginas={pessoas.totalPaginas} onMudarPagina={setPagina} /></div>}
      </Card>
    </main>
  );
}

function mensagemErro(err: unknown) { return err instanceof ApiError ? err.message : "Não foi possível concluir a operação."; }
function formatarData(valor: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)); }
