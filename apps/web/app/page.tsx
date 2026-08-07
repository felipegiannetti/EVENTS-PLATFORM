"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { accessToken, carregando } = useAuth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">
        Ingressos, sem complicação
      </p>
      <h1 className="mt-3 max-w-xl text-4xl font-bold tracking-tight text-foreground">
        Gerencie seus eventos do início à porta de entrada.
      </h1>
      <p className="mt-4 max-w-lg text-muted">
        Lotes, links de venda, controle de acesso e check-in — tudo em um só lugar, feito pra
        organizador que não tem tempo a perder.
      </p>

      {!carregando && (
        <div className="mt-8">
          <Link href={accessToken ? "/eventos" : "/registro"}>
            <Button>{accessToken ? "Ver meus eventos" : "Criar minha conta"}</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
