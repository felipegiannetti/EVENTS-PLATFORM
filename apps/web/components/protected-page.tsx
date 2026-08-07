"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/** Redireciona para /login se não houver sessão — usado em toda tela que precisa de accessToken. */
export function ProtectedPage({ children }: { children: (accessToken: string) => ReactNode }) {
  const { accessToken, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !accessToken) {
      router.replace("/login");
    }
  }, [carregando, accessToken, router]);

  if (carregando || !accessToken) {
    return <div className="page-shell"><div className="h-64 animate-pulse rounded-3xl border border-border/10 bg-card/70" /></div>;
  }

  return <>{children(accessToken)}</>;
}
