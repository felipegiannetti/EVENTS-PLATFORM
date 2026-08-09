"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import jsQR from "jsqr";
import { Camera, CheckCircle2, ScanLine, Search, XCircle } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination, ITENS_POR_PAGINA } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { checkin } from "@/lib/tickets-client";

interface LeituraResultado {
  id: string;
  ok: boolean;
  nome: string | null;
  mensagem: string;
  horario: string;
}

/** Trava em 500 pra não crescer sem limite numa sessão de check-in muito longa — bem acima do que qualquer evento real deveria gerar num único plantão. */
const MAXIMO_LEITURAS_EM_MEMORIA = 500;

export default function CheckinEventoPage() {
  return <ProtectedPage>{(token) => <PainelCheckin token={token} />}</ProtectedPage>;
}

const INTERVALO_LEITURA_MS = 200;

/** Formato do qrToken (ver apps/api/src/tickets/qr-token.util.ts): `${uuid}.${nonce de 16 hex}.${assinatura HMAC-SHA256 de 64 hex}`. */
const REGEX_QR_TOKEN_COMPLETO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f]{16}\.[0-9a-f]{64}$/i;

function PainelCheckin({ token }: { token: string }) {
  const { id } = useParams<{ id: string }>();
  const [campoLeitura, setCampoLeitura] = useState("");
  const [processando, setProcessando] = useState(false);
  const [resultados, setResultados] = useState<LeituraResultado[]>([]);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processandoRef = useRef(false);
  const [buscaValidados, setBuscaValidados] = useState("");
  const [paginaValidados, setPaginaValidados] = useState(1);

  useEffect(() => {
    inputRef.current?.focus();
    return () => desligarCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function processarToken(qrToken: string) {
    if (!qrToken.trim() || processandoRef.current) return;
    processandoRef.current = true;
    setProcessando(true);
    try {
      const ingresso = await checkin(id, qrToken.trim(), token);
      const nome = ingresso.compradorNome ?? ingresso.compradorEmail;
      registrarResultado(true, nome, nome ? `Check-in confirmado — ${nome}` : `Check-in confirmado — ingresso ${ingresso.id.slice(0, 8)}...`);
    } catch (err) {
      registrarResultado(false, null, err instanceof ApiError ? err.message : "Não foi possível validar esse código.");
    } finally {
      processandoRef.current = false;
      setProcessando(false);
      setCampoLeitura("");
      inputRef.current?.focus();
    }
  }

  function registrarResultado(ok: boolean, nome: string | null, mensagem: string) {
    setPaginaValidados(1);
    setResultados((atual) => [
      { id: crypto.randomUUID(), ok, nome, mensagem, horario: new Date().toLocaleTimeString("pt-BR") },
      ...atual.slice(0, MAXIMO_LEITURAS_EM_MEMORIA - 1),
    ]);
  }

  async function onSubmitCampo(e: React.FormEvent) {
    e.preventDefault();
    await processarToken(campoLeitura);
  }

  /**
   * Leitor USB (modo teclado-wedge) digita o código rapidíssimo — não dá pra confiar que ele manda
   * um Enter/Tab no final (varia por configuração do leitor). Em vez disso, valida automaticamente
   * assim que o valor digitado bate exatamente com o formato do qrToken, sem esperar clique no botão.
   */
  function onMudarCampo(valor: string) {
    setCampoLeitura(valor);
    if (REGEX_QR_TOKEN_COMPLETO.test(valor.trim())) {
      processarToken(valor);
    }
  }

  /** jsQR (pura JS, canvas) em vez da BarcodeDetector nativa — essa não existe no Safari/iOS, então a câmera não funcionaria na maioria dos celulares sem isso. */
  async function ligarCamera() {
    setErroCamera(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraAtiva(true);
      intervalRef.current = setInterval(escanearFrame, INTERVALO_LEITURA_MS);
    } catch {
      setErroCamera("Não foi possível acessar a câmera — verifique a permissão do navegador.");
    }
  }

  function desligarCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraAtiva(false);
  }

  function escanearFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA || processandoRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const codigo = jsQR(imageData.data, imageData.width, imageData.height);
    if (codigo?.data) {
      processarToken(codigo.data);
    }
  }

  const resultadosFiltrados = useMemo(() => {
    const termo = buscaValidados.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return resultados;
    return resultados.filter(
      (resultado) =>
        (resultado.nome ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        resultado.mensagem.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [resultados, buscaValidados]);

  const totalPaginasValidados = Math.max(1, Math.ceil(resultadosFiltrados.length / ITENS_POR_PAGINA));
  const paginaValidadosAtual = Math.min(paginaValidados, totalPaginasValidados);
  const resultadosPaginados = resultadosFiltrados.slice(
    (paginaValidadosAtual - 1) * ITENS_POR_PAGINA,
    paginaValidadosAtual * ITENS_POR_PAGINA,
  );

  return (
    <main className="page-shell max-w-3xl">
      <span className="eyebrow">
        <ScanLine size={12} /> Check-in via scanner
      </span>
      <h1 className="page-title">Validar ingressos na entrada</h1>
      <p className="page-description">
        Use um leitor de código de barras/QR USB (funciona como teclado — só manter o cursor no
        campo abaixo) ou a câmera do dispositivo (funciona em celular também).
      </p>

      <Card className="mt-8 p-6">
        <form onSubmit={onSubmitCampo} className="flex gap-3">
          <input
            ref={inputRef}
            value={campoLeitura}
            onChange={(e) => onMudarCampo(e.target.value)}
            placeholder="Campo de leitura — escaneie ou cole o código aqui"
            autoFocus
            className="h-12 flex-1 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <Button type="submit" loading={processando}>
            Validar
          </Button>
        </form>

        <div className="mt-5 border-t border-border/10 pt-5">
          {!cameraAtiva ? (
            <Button variant="secondary" onClick={ligarCamera} className="gap-2">
              <Camera size={16} /> Ligar câmera
            </Button>
          ) : (
            <div>
              <video ref={videoRef} muted playsInline className="aspect-video w-full max-w-sm rounded-xl bg-black object-cover" />
              <Button variant="secondary" onClick={desligarCamera} className="mt-3">
                Desligar câmera
              </Button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          {erroCamera && <p className="mt-3 text-sm text-danger">{erroCamera}</p>}
        </div>
      </Card>

      <section className="mt-8">
        <h2 className="section-title !text-base">Leituras recentes</h2>

        {resultados.length > 0 && (
          <div className="relative mt-4">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={buscaValidados}
              onChange={(e) => {
                setBuscaValidados(e.target.value);
                setPaginaValidados(1);
              }}
              placeholder="Buscar por nome do participante..."
              className="h-11 w-full rounded-xl border border-border/15 bg-background/60 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {resultadosPaginados.map((resultado) => (
            <Card key={resultado.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {resultado.ok ? <CheckCircle2 size={18} className="text-success" /> : <XCircle size={18} className="text-danger" />}
                <p className={`text-sm ${resultado.ok ? "text-foreground" : "text-danger"}`}>{resultado.mensagem}</p>
              </div>
              <span className="text-xs text-muted">{resultado.horario}</span>
            </Card>
          ))}
          {resultados.length === 0 && <p className="text-sm text-muted">Nenhuma leitura ainda.</p>}
          {resultados.length > 0 && resultadosFiltrados.length === 0 && (
            <p className="text-sm text-muted">Nenhuma leitura encontrada para essa busca.</p>
          )}
        </div>

        <Pagination pagina={paginaValidadosAtual} totalPaginas={totalPaginasValidados} onMudarPagina={setPaginaValidados} />
      </section>
    </main>
  );
}
