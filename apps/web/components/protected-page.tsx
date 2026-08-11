"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedPageProps {
  children: (accessToken: string) => ReactNode;
  /** Além de exigir sessão, exige usuario.papelGlobal === "admin_geral" — redireciona pra / se não for admin. */
  somenteAdmin?: boolean;
}

/** Redireciona para /login se não houver sessão (e, com somenteAdmin, para / se não for admin) — usado em toda tela que precisa de accessToken. */
export function ProtectedPage({ children, somenteAdmin = false }: ProtectedPageProps) {
  const { accessToken, usuario, carregando } = useAuth();
  const router = useRouter();

  const naoEhAdmin = somenteAdmin && usuario?.papelGlobal !== "admin_geral";

  useEffect(() => {
    if (carregando) return;
    if (!accessToken) {
      router.replace("/login");
    } else if (naoEhAdmin) {
      router.replace("/");
    }
  }, [carregando, accessToken, naoEhAdmin, router]);

  if (carregando || !accessToken || naoEhAdmin) {
    return <div className="page-shell"><div className="h-64 animate-pulse rounded-3xl border border-border/10 bg-card/70" /></div>;
  }

  return <>{children(accessToken)}</>;
}
