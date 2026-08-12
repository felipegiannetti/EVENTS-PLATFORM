"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthShell } from "@/components/auth-shell";
import { Card } from "@/components/ui/card";

export default function EntrarGooglePage() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="h-64 animate-pulse rounded-3xl bg-card" /></div>}>
      <ProcessarRetornoGoogle />
    </Suspense>
  );
}

/** Página de destino do redirect do backend após /auth/google/callback — só lê o accessToken da URL e finaliza o login. */
function ProcessarRetornoGoogle() {
  const { definirSessaoExterna } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    if (!accessToken) {
      setErro("Não foi possível concluir o login com o Google — token não recebido.");
      return;
    }
    definirSessaoExterna(accessToken)
      .then(() => router.replace("/"))
      .catch(() => setErro("Não foi possível concluir o login com o Google."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell title="Entrando com Google" description="Só um instante enquanto confirmamos sua conta.">
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        {erro ? (
          <>
            <AlertTriangle className="text-danger" />
            <p className="text-sm text-danger">{erro}</p>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin text-primary" />
            <p className="text-sm text-muted">Finalizando login...</p>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
