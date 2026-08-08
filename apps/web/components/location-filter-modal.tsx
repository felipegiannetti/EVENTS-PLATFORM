"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation, Search, X } from "lucide-react";

interface LocationFilterModalProps {
  localizacoes: string[];
  valor: string;
  onSelecionar: (localizacao: string) => void;
}

/**
 * Modal de localização estilo Sympla: busca + "usar minha localização atual" + lista de cidades.
 * A geolocalização do navegador não resolve sozinha pra "cidade, estado" sem um serviço de
 * geocodificação (que não existe nesta fatia) — por isso, em vez de fingir que funciona, mostramos
 * um aviso claro quando a permissão é concedida mas não dá pra resolver a cidade automaticamente.
 */
export function LocationFilterModal({ localizacoes, valor, onSelecionar }: LocationFilterModalProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [avisoGeo, setAvisoGeo] = useState<string | null>(null);

  const localizacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return termo ? localizacoes.filter((item) => item.toLocaleLowerCase("pt-BR").includes(termo)) : localizacoes;
  }, [busca, localizacoes]);

  function selecionar(localizacao: string) {
    onSelecionar(localizacao);
    setAberto(false);
    setBusca("");
    setAvisoGeo(null);
  }

  function usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
      setAvisoGeo("Seu navegador não suporta localização automática — escolha da lista abaixo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setAvisoGeo(
          "Ainda não conseguimos identificar sua cidade automaticamente a partir da localização — escolha da lista abaixo.",
        );
      },
      () => {
        setAvisoGeo("Não conseguimos acessar sua localização — escolha da lista abaixo.");
      },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-border/15 bg-background px-3 text-left text-sm font-medium text-foreground outline-none transition-colors hover:border-primary/40 focus:border-primary"
      >
        <MapPin size={16} className="shrink-0 text-primary" />
        <span className="truncate">{valor || "Todas as localizações"}</span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setAberto(false)}>
          <div
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/10 p-5">
              <h2 className="text-lg font-semibold text-foreground">Localização</h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-border/5 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="search-shell flex items-center gap-2 rounded-xl border border-border/15 bg-background px-3">
                <Search size={17} className="shrink-0 text-muted" />
                <input
                  autoFocus
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Onde?"
                  aria-label="Buscar localização"
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70"
                />
              </div>

              <button
                type="button"
                onClick={usarLocalizacaoAtual}
                className="mt-4 flex w-full items-center gap-3 border-b border-border/10 pb-4 text-left text-sm font-medium text-primary hover:opacity-80"
              >
                <Navigation size={17} />
                Usar minha localização atual
              </button>
              {avisoGeo && <p className="mt-3 text-xs text-muted">{avisoGeo}</p>}

              <div className="mt-3 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => selecionar("")}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-primary/5 ${!valor ? "font-semibold text-primary" : "text-foreground"}`}
                >
                  <MapPin size={15} className="shrink-0 text-muted" />
                  Qualquer lugar
                </button>
                {localizacoesFiltradas.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selecionar(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-primary/5 ${valor === item ? "font-semibold text-primary" : "text-foreground"}`}
                  >
                    <MapPin size={15} className="shrink-0 text-muted" />
                    {item}
                  </button>
                ))}
                {localizacoesFiltradas.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted">Nenhuma localização encontrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
