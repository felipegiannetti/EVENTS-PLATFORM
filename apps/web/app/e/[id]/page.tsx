"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Lock, MapPin, Ticket, XCircle } from "lucide-react";
import type { CupomValidacaoPublicaResponse, EventoResponse } from "@events-platform/shared-types";
import { formatarEnderecoEvento, ROTULO_CATEGORIA_EVENTO } from "@events-platform/shared-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { buscarEventoPublico, desbloquearCupomPublico, urlBannerEvento, validarCupomPublico } from "@/lib/events-client";

export default function EventoPublicoPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Carregando...</p>}>
      <EventoPublico />
    </Suspense>
  );
}

function EventoPublico() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const codigoCupom = searchParams.get("cupom");

  const [evento, setEvento] = useState<EventoResponse | null | "nao_encontrado">(null);
  const [cupom, setCupom] = useState<CupomValidacaoPublicaResponse | null>(null);
  const [cupomInvalido, setCupomInvalido] = useState(false);
  const [senhaCupom, setSenhaCupom] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [desbloqueando, setDesbloqueando] = useState(false);

  useEffect(() => {
    buscarEventoPublico(id)
      .then(setEvento)
      .catch(() => setEvento("nao_encontrado"));
  }, [id]);

  useEffect(() => {
    if (!codigoCupom) return;
    validarCupomPublico(id, codigoCupom)
      .then(setCupom)
      .catch((err) => {
        if (err instanceof ApiError) setCupomInvalido(true);
      });
  }, [id, codigoCupom]);

  const cupomTravado = cupom?.especial && cupom.tipo === undefined;

  async function onDesbloquear(e: FormEvent) {
    e.preventDefault();
    if (!codigoCupom) return;
    setErroSenha(null);
    setDesbloqueando(true);
    try {
      const resultado = await desbloquearCupomPublico(id, codigoCupom, senhaCupom);
      setCupom(resultado);
    } catch (err) {
      setErroSenha(err instanceof ApiError ? err.message : "Não foi possível desbloquear o cupom.");
    } finally {
      setDesbloqueando(false);
    }
  }

  if (evento === "nao_encontrado") {
    return (
      <main className="page-shell max-w-2xl text-center">
        <h1 className="page-title">Evento não encontrado</h1>
        <p className="page-description">
          Esse evento não existe ou ainda não foi liberado para compradores pelo organizador.
        </p>
      </main>
    );
  }

  if (!evento) {
    return <p className="p-6 text-sm text-muted">Carregando...</p>;
  }

  return (
    <main className="page-shell max-w-3xl">
      {evento.temBanner && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlBannerEvento(id)} alt={evento.nome} className="h-64 w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {ROTULO_CATEGORIA_EVENTO[evento.categoria]}
        </span>
        {evento.somenteMaioresDeIdade && (
          <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning">18+</span>
        )}
      </div>
      <h1 className="page-title">{evento.nome}</h1>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <CalendarDays size={16} className="text-primary" /> {new Date(evento.data).toLocaleString("pt-BR")}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted">
        <MapPin size={16} className="text-primary" /> {formatarEnderecoEvento(evento)}
      </p>

      {codigoCupom && cupomTravado && (
        <Card className="mt-6 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Lock size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Cupom especial <span className="font-mono">{cupom.codigo}</span>
              </p>
              <p className="text-xs text-muted">Este cupom dá acesso a ingressos especiais — digite a senha pra ver o desconto.</p>
            </div>
          </div>
          <form onSubmit={onDesbloquear} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1">
              <Input
                id="senha-cupom-publico"
                label="Senha"
                type="password"
                required
                value={senhaCupom}
                onChange={(e) => setSenhaCupom(e.target.value)}
                error={erroSenha ?? undefined}
              />
            </div>
            <Button type="submit" loading={desbloqueando}>
              Desbloquear
            </Button>
          </form>
        </Card>
      )}

      {codigoCupom && !cupomTravado && (
        <Card className={`mt-6 flex items-center gap-3 p-4 ${cupom ? "border-success/20 bg-success/5" : cupomInvalido ? "border-danger/20 bg-danger/5" : ""}`}>
          {cupom && cupom.tipo !== undefined && cupom.valor !== undefined ? (
            <>
              <CheckCircle2 size={18} className="shrink-0 text-success" />
              <p className="text-sm text-foreground">
                Cupom <strong className="font-mono">{cupom.codigo}</strong> aplicado —{" "}
                {cupom.tipo === "percentual" ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`} de desconto.
              </p>
            </>
          ) : cupomInvalido ? (
            <>
              <XCircle size={18} className="shrink-0 text-danger" />
              <p className="text-sm text-foreground">
                O cupom <strong className="font-mono">{codigoCupom}</strong> não é válido para este evento (expirado, inativo ou inexistente).
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Verificando cupom...</p>
          )}
        </Card>
      )}

      {evento.descricao && (
        <Card className="mt-6 p-6">
          <h2 className="section-title !text-base">Sobre o evento</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{evento.descricao}</p>
        </Card>
      )}

      {(evento.contatoNome || evento.contatoEmail || evento.contatoTelefone) && (
        <Card className="mt-6 p-6">
          <h2 className="section-title !text-base">Contato</h2>
          <p className="mt-2 text-sm text-muted">
            {[evento.contatoNome, evento.contatoEmail, evento.contatoTelefone].filter(Boolean).join(" · ")}
          </p>
        </Card>
      )}

      <Card className="mt-6 flex items-center gap-3 border-dashed border-primary/25 bg-primary/5 p-6">
        <Ticket size={20} className="shrink-0 text-primary" />
        <p className="text-sm text-foreground">
          A compra online ainda não está disponível nesta plataforma — a emissão de ingressos por
          enquanto é feita diretamente pelo organizador.
        </p>
      </Card>
    </main>
  );
}
