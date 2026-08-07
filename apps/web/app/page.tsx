"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const { accessToken, carregando, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4">
      <Card className="w-full text-center">
        <h1 className="text-xl font-semibold text-neutral-900">Plataforma de Ingressos NOVYX</h1>

        {carregando ? (
          <p className="mt-4 text-sm text-neutral-500">Carregando...</p>
        ) : accessToken ? (
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/eventos">
              <Button className="w-full">Ver meus eventos</Button>
            </Link>
            <Button variant="secondary" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/login">
              <Button className="w-full">Entrar</Button>
            </Link>
            <Link href="/registro">
              <Button variant="secondary" className="w-full">
                Criar conta
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
