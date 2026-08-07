"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

/** Header compartilhado por toda página — ver docs/frontend/design-system.md. */
export function Header() {
  const { accessToken, carregando, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-border/10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          RARO <span className="text-primary">Tickets</span>
        </Link>

        <nav className="flex items-center gap-4">
          {!carregando && accessToken && (
            <Link href="/eventos" className="text-sm text-foreground/80 hover:text-primary">
              Meus eventos
            </Link>
          )}

          <ThemeToggle />

          {!carregando &&
            (accessToken ? (
              <Button variant="secondary" onClick={() => logout()}>
                Sair
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="secondary">Entrar</Button>
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
