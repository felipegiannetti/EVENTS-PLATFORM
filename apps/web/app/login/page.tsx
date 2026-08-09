"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useNavigationLoading } from "@/lib/navigation-loading";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const { login } = useAuth();
  const { iniciar } = useNavigationLoading();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    iniciar();
    try {
      await login({ email, senha });
      router.push("/");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <AuthShell title="Acesse sua conta" description="Gerencie eventos, vendas e equipes em um só lugar.">
      <Card className="p-7 sm:p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="senha"
            label="Senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <Button type="submit" loading={enviando} className="mt-1 w-full">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Não tem conta?{" "}
          <Link href="/registro" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
