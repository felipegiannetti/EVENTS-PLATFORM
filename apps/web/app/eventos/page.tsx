"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventoResponse } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listarEventos } from "@/lib/events-client";

export default function EventosPage() {
  return <ProtectedPage>{(token) => <ListaEventos token={token} />}</ProtectedPage>;
}

function ListaEventos({ token }: { token: string }) {
  const [eventos, setEventos] = useState<EventoResponse[] | null>(null);

  useEffect(() => {
    listarEventos(token).then(setEventos);
  }, [token]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Seus eventos</h1>
        <Link href="/eventos/novo">
          <Button>Criar evento</Button>
        </Link>
      </div>

      {eventos === null && <p className="text-sm text-neutral-500">Carregando...</p>}
      {eventos?.length === 0 && (
        <Card className="text-center text-sm text-neutral-500">
          Você ainda não tem nenhum evento.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {eventos?.map((evento) => (
          <Link key={evento.id} href={`/eventos/${evento.id}`}>
            <Card className="transition-shadow hover:shadow-none">
              <p className="font-medium text-neutral-900">{evento.nome}</p>
              <p className="text-sm text-neutral-500">
                {new Date(evento.data).toLocaleDateString("pt-BR")} · {evento.local}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
