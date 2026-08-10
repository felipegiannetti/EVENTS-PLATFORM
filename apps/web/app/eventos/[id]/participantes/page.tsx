"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Mail, Pencil, Search, Send, Tag, Users, X } from "lucide-react";
import type { EventoResponse, IngressoResponse, LoteResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { Pagination, ITENS_POR_PAGINA } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { buscarEvento, listarLotes } from "@/lib/events-client";
import { COR_STATUS_INGRESSO, ROTULO_STATUS_INGRESSO } from "@/lib/status-ingresso";
import {
  atualizarIngresso,
  baixarParticipantesCsv,
  cancelarIngresso,
  enviarEmailParticipantes,
  listarIngressos,
  reenviarIngresso,
} from "@/lib/tickets-client";

type CampoOrdenacao = "status" | "participante" | "email" | "tipo" | "data";

function SortableHeader({
  campo,
  ordenacao,
  onOrdenarPor,
  className = "",
  children,
}: {
  campo: CampoOrdenacao;
  ordenacao: { campo: CampoOrdenacao; direcao: "asc" | "desc" };
  onOrdenarPor: (campo: CampoOrdenacao) => void;
  className?: string;
  children: ReactNode;
}) {
  const ativo = ordenacao.campo === campo;
  const Icone = ativo ? (ordenacao.direcao === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={`px-5 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onOrdenarPor(campo)}
        className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground ${ativo ? "text-foreground" : ""}`}
      >
        {children}
        <Icone size={12} className={ativo ? "text-primary" : "text-muted/60"} />
      </button>
    </th>
  );
}

export default function ParticipantesEventoPage() {
  return <ProtectedPage>{(token) => <PainelParticipantes token={token} />}</ProtectedPage>;
}

function PainelParticipantes({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [ingressos, setIngressos] = useState<IngressoResponse[]>([]);
  const [lotes, setLotes] = useState<LoteResponse[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [mostrarModalEmail, setMostrarModalEmail] = useState(false);
  const [ingressoEditando, setIngressoEditando] = useState<IngressoResponse | null>(null);
  const [ingressoCancelando, setIngressoCancelando] = useState<IngressoResponse | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [avisoAcao, setAvisoAcao] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: "asc" | "desc" }>({
    campo: "data",
    direcao: "desc",
  });
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  function recarregar() {
    Promise.all([buscarEvento(id, token), listarIngressos(id, token), listarLotes(id, token)])
      .then(([eventoAtual, ingressosAtuais, lotesAtuais]) => {
        setEvento(eventoAtual);
        setIngressos(ingressosAtuais);
        setLotes(lotesAtuais);
      })
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os participantes."));
  }

  const nomeLote = new Map(lotes.map((lote) => [lote.id, lote.nome]));

  const ingressosOrdenados = useMemo(() => {
    const valor = (ingresso: IngressoResponse): string | number => {
      switch (ordenacao.campo) {
        case "status":
          return ROTULO_STATUS_INGRESSO[ingresso.status];
        case "participante":
          return ingresso.compradorNome ?? "";
        case "email":
          return ingresso.compradorEmail ?? "";
        case "tipo":
          return nomeLote.get(ingresso.loteId) ?? "";
        case "data":
          return new Date(ingresso.criadoEm).getTime();
      }
    };
    const sinal = ordenacao.direcao === "asc" ? 1 : -1;
    return [...ingressos].sort((a, b) => {
      const valorA = valor(a);
      const valorB = valor(b);
      if (typeof valorA === "number" && typeof valorB === "number") {
        return (valorA - valorB) * sinal;
      }
      return String(valorA).localeCompare(String(valorB), "pt-BR") * sinal;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingressos, ordenacao, lotes]);

  function onOrdenarPor(campo: CampoOrdenacao) {
    setOrdenacao((atual) =>
      atual.campo === campo ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" } : { campo, direcao: "asc" },
    );
  }

  const ingressosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return ingressosOrdenados;
    return ingressosOrdenados.filter(
      (ingresso) =>
        (ingresso.compradorNome ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (ingresso.compradorEmail ?? "").toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [ingressosOrdenados, busca]);

  const totalPaginas = Math.max(1, Math.ceil(ingressosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const ingressosPaginados = ingressosFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  async function onExportarCsv() {
    setExportando(true);
    setErro(null);
    try {
      await baixarParticipantesCsv(id, token);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível exportar o CSV.");
    } finally {
      setExportando(false);
    }
  }

  async function onReenviar(ingresso: IngressoResponse) {
    setReenviandoId(ingresso.id);
    setAvisoAcao(null);
    try {
      await reenviarIngresso(id, ingresso.id, token);
      setAvisoAcao({ tipo: "sucesso", texto: `Email reenviado para ${ingresso.compradorEmail}.` });
    } catch (err) {
      setAvisoAcao({ tipo: "erro", texto: err instanceof ApiError ? err.message : "Não foi possível reenviar o email." });
    } finally {
      setReenviandoId(null);
    }
  }

  async function onConfirmarCancelamento() {
    if (!ingressoCancelando) return;
    setCancelando(true);
    try {
      await cancelarIngresso(id, ingressoCancelando.id, token);
      setIngressoCancelando(null);
      recarregar();
    } catch (err) {
      setAvisoAcao({ tipo: "erro", texto: err instanceof ApiError ? err.message : "Não foi possível cancelar o ingresso." });
      setIngressoCancelando(null);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">
        <Users size={12} /> Participantes
      </span>
      <h1 className="page-title">Quem já garantiu presença</h1>
      <p className="page-description">
        Uma linha por ingresso emitido — status, participante e como comprou.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" loading={exportando} onClick={onExportarCsv} className="gap-2">
          <Download size={16} /> Exportar participantes (CSV)
        </Button>
        <Button onClick={() => setMostrarModalEmail(true)} className="gap-2">
          <Mail size={16} /> Enviar email aos compradores
        </Button>
      </div>

      {erro && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{erro}</p>}
      {avisoAcao && (
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${avisoAcao.tipo === "sucesso" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
          {avisoAcao.texto}
        </p>
      )}

      {ingressos.length > 0 && (
        <div className="relative mt-6">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nome ou email do participante..."
            className="h-11 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/10 bg-card shadow-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border/10 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <SortableHeader campo="status" ordenacao={ordenacao} onOrdenarPor={onOrdenarPor}>Status</SortableHeader>
              <SortableHeader campo="participante" ordenacao={ordenacao} onOrdenarPor={onOrdenarPor}>Participante</SortableHeader>
              <SortableHeader campo="email" ordenacao={ordenacao} onOrdenarPor={onOrdenarPor}>Email</SortableHeader>
              <SortableHeader campo="tipo" ordenacao={ordenacao} onOrdenarPor={onOrdenarPor}>Tipo de ingresso</SortableHeader>
              <SortableHeader campo="data" ordenacao={ordenacao} onOrdenarPor={onOrdenarPor}>Data de emissão</SortableHeader>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ingressosPaginados.map((ingresso) => (
              <tr key={ingresso.id} className="border-b border-border/10 last:border-0">
                <td className="px-5 py-4">
                  <StatusDot cor={COR_STATUS_INGRESSO[ingresso.status]} rotulo={ROTULO_STATUS_INGRESSO[ingresso.status]} />
                </td>
                <td className="px-5 py-4 text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    {ingresso.compradorNome ?? "—"}
                    {ingresso.cupomCodigo && (
                      <span title={`Cupom usado: ${ingresso.cupomCodigo}`} className="inline-flex shrink-0">
                        <Tag size={13} className="text-primary" />
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted">{ingresso.compradorEmail ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{nomeLote.get(ingresso.loteId) ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{new Date(ingresso.criadoEm).toLocaleString("pt-BR")}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="Reenviar email de confirmação"
                      aria-label="Reenviar email de confirmação"
                      disabled={!ingresso.compradorEmail || reenviandoId === ingresso.id}
                      onClick={() => onReenviar(ingresso)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border/15 text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      type="button"
                      title="Editar dados do comprador"
                      aria-label="Editar dados do comprador"
                      onClick={() => setIngressoEditando(ingresso)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border/15 text-muted transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Cancelar ingresso"
                      aria-label="Cancelar ingresso"
                      disabled={ingresso.status === "cancelado"}
                      onClick={() => setIngressoCancelando(ingresso)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border/15 text-muted transition-colors hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ingressos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum ingresso emitido ainda.
                </td>
              </tr>
            )}
            {ingressos.length > 0 && ingressosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum participante encontrado para essa busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onMudarPagina={setPagina} />

      {mostrarModalEmail && evento && (
        <ModalEnviarEmail eventoId={id} nomeEvento={evento.nome} token={token} onFechar={() => setMostrarModalEmail(false)} />
      )}

      {ingressoEditando && (
        <ModalEditarIngresso
          eventoId={id}
          ingresso={ingressoEditando}
          token={token}
          onFechar={() => setIngressoEditando(null)}
          onSalvo={() => {
            setIngressoEditando(null);
            recarregar();
          }}
        />
      )}

      {ingressoCancelando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-semibold">Cancelar este ingresso?</h2>
            <p className="mt-2 text-sm text-muted">
              O ingresso de <strong className="text-foreground">{ingressoCancelando.compradorNome ?? ingressoCancelando.compradorEmail ?? "este comprador"}</strong> vai
              ficar marcado como cancelado e não vai mais passar no check-in. Essa ação não pode ser desfeita por aqui.
            </p>
            <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2.5 text-xs leading-5 text-warning">
              Como ainda não existe checkout de pagamento na plataforma, nenhum valor foi cobrado nesta emissão — por isso
              nenhum reembolso em dinheiro é processado aqui. Quando o checkout existir, cancelar por aqui vai disparar o
              estorno automaticamente (ver docs/architecture/11-roadmap.md).
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setIngressoCancelando(null)} className="flex-1" disabled={cancelando}>
                Voltar
              </Button>
              <Button onClick={onConfirmarCancelamento} loading={cancelando} className="flex-1 !bg-danger !bg-none">
                Cancelar ingresso
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

function ModalEditarIngresso({
  eventoId,
  ingresso,
  token,
  onFechar,
  onSalvo,
}: {
  eventoId: string;
  ingresso: IngressoResponse;
  token: string;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState(ingresso.compradorNome ?? "");
  const [email, setEmail] = useState(ingresso.compradorEmail ?? "");
  const [documento, setDocumento] = useState(ingresso.compradorDocumento ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await atualizarIngresso(
        eventoId,
        ingresso.id,
        { compradorNome: nome || undefined, compradorEmail: email, compradorDocumento: documento || undefined },
        token,
      );
      onSalvo();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-lg font-semibold">Editar dados do comprador</h2>
        <p className="mt-1 text-sm text-muted">O email é o que liga esse ingresso à conta de quem comprou — mudar aqui também muda onde ele aparece em &quot;Meus ingressos&quot;.</p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <Input id="editar-ingresso-nome" label="Nome do comprador" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input id="editar-ingresso-email" label="Email do comprador" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input id="editar-ingresso-documento" label="Documento (opcional)" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onFechar} className="flex-1" disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" loading={salvando} className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ModalEnviarEmail({
  eventoId,
  nomeEvento,
  token,
  onFechar,
}: {
  eventoId: string;
  nomeEvento: string;
  token: string;
  onFechar: () => void;
}) {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<number | null>(null);
  const dataFormatada = new Date().toLocaleDateString("pt-BR");

  async function onEnviar() {
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await enviarEmailParticipantes(eventoId, mensagem, token);
      setSucesso(resultado.enviadosPara);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível enviar o email.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold">Enviar email aos compradores</h2>
        <p className="mt-1 text-sm text-muted">
          Vai pra todo mundo que comprou um ingresso deste evento (email cadastrado na emissão).
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-border/20 bg-background/60 p-4">
          <span className="eyebrow">
            Email · {nomeEvento} · {dataFormatada}
          </span>
          <p className="mt-3 text-sm italic text-muted">— sua mensagem entra aqui —</p>
        </div>

        <div className="mt-4">
          <Textarea
            id="mensagem-email"
            label="Sua mensagem"
            placeholder="Escreva o que você quer avisar aos compradores..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
        {sucesso !== null && (
          <p className="mt-3 text-sm text-success">Email enviado para {sucesso} comprador(es).</p>
        )}

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" onClick={onFechar} className="flex-1">
            {sucesso !== null ? "Fechar" : "Cancelar"}
          </Button>
          {sucesso === null && (
            <Button onClick={onEnviar} loading={enviando} disabled={!mensagem.trim()} className="flex-1">
              Enviar
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
