"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Mail, Users } from "lucide-react";
import type { EventoResponse, IngressoResponse, LoteResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { buscarEvento, listarLotes } from "@/lib/events-client";
import { baixarParticipantesCsv, enviarEmailParticipantes, listarIngressos } from "@/lib/tickets-client";

const ROTULO_STATUS: Record<string, string> = {
  valido: "Confirmado",
  usado: "Check-in feito",
  cancelado: "Cancelado",
};

const ESTILO_STATUS: Record<string, string> = {
  valido: "bg-success/10 text-success",
  usado: "bg-primary/10 text-primary",
  cancelado: "bg-danger/10 text-danger",
};

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

  useEffect(() => {
    Promise.all([buscarEvento(id, token), listarIngressos(id, token), listarLotes(id, token)])
      .then(([eventoAtual, ingressosAtuais, lotesAtuais]) => {
        setEvento(eventoAtual);
        setIngressos(ingressosAtuais);
        setLotes(lotesAtuais);
      })
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar os participantes."));
  }, [id, token]);

  const nomeLote = new Map(lotes.map((lote) => [lote.id, lote.nome]));

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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border/10 bg-card shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border/10 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Participante</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Tipo de ingresso</th>
              <th className="px-5 py-3">Data de emissão</th>
            </tr>
          </thead>
          <tbody>
            {ingressos.map((ingresso) => (
              <tr key={ingresso.id} className="border-b border-border/10 last:border-0">
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_STATUS[ingresso.status] ?? ""}`}>
                    {ROTULO_STATUS[ingresso.status] ?? ingresso.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-foreground">{ingresso.compradorNome ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{ingresso.compradorEmail ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{nomeLote.get(ingresso.loteId) ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{new Date(ingresso.criadoEm).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {ingressos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum ingresso emitido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModalEmail && evento && (
        <ModalEnviarEmail eventoId={id} nomeEvento={evento.nome} token={token} onFechar={() => setMostrarModalEmail(false)} />
      )}
    </main>
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
