"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Gift } from "lucide-react";
import { validarCpf, validarCnpj, type OfertaIndicacaoPublicaResponse, type TipoPessoa } from "@events-platform/shared-types";
import { useAuth } from "@/lib/auth-context";
import { useNavigationLoading } from "@/lib/navigation-loading";
import { ApiError } from "@/lib/api-client";
import { formatarDocumento, formatarTelefone } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-shell";
import { GoogleLoginButton } from "@/components/google-login-button";
import { buscarOfertaIndicacao } from "@/lib/referrals-client";

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="page-shell"><div className="h-64 animate-pulse rounded-3xl bg-card" /></div>}>
      <FormularioRegistro />
    </Suspense>
  );
}

function FormularioRegistro() {
  const { registrar } = useAuth();
  const { iniciar } = useNavigationLoading();
  const router = useRouter();
  const codigoIndicacao = useSearchParams().get("ref") ?? undefined;
  const [ofertaIndicacao, setOfertaIndicacao] = useState<OfertaIndicacaoPublicaResponse | null>(null);
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>("fisica");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [documento, setDocumento] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [erroDocumento, setErroDocumento] = useState<string | null>(null);
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!codigoIndicacao) return;
    buscarOfertaIndicacao(codigoIndicacao).then(setOfertaIndicacao).catch(() => setOfertaIndicacao(null));
  }, [codigoIndicacao]);

  function onDocumentoChange(valor: string) {
    setDocumento(formatarDocumento(valor, tipoPessoa));
  }

  function onDocumentoBlur() {
    if (!documento) {
      setErroDocumento(null);
      return;
    }
    const valido = tipoPessoa === "fisica" ? validarCpf(documento) : validarCnpj(documento);
    setErroDocumento(valido ? null : `${tipoPessoa === "fisica" ? "CPF" : "CNPJ"} inválido — confira os números`);
  }

  function onConfirmarSenhaBlur() {
    setErroConfirmarSenha(confirmarSenha && confirmarSenha !== senha ? "As senhas não coincidem" : null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmarSenha) {
      setErroConfirmarSenha("As senhas não coincidem");
      return;
    }
    setEnviando(true);
    iniciar();
    try {
      await registrar({
        nome,
        email,
        senha,
        tipoPessoa,
        documento,
        dataNascimento: tipoPessoa === "fisica" ? dataNascimento : undefined,
        telefone,
        codigoIndicacao,
      });
      router.push("/");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar a conta.");
      setEnviando(false);
    }
  }

  return (
    <AuthShell title="Crie sua conta" description="Comece a criar experiências memoráveis em poucos minutos.">
      <Card className="p-7 sm:p-8">
        {codigoIndicacao && (
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-primary"><Gift size={16} /> Convite de indicação ativo</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {ofertaIndicacao
                ? `${ofertaIndicacao.indicadorNome} convidou você. Você receberá permanentemente ${ofertaIndicacao.percentualBeneficioOrganizador.toFixed(2)}% adicional da taxa da plataforma nos eventos que organizar que possuírem ingressos pagos na plataforma.`
                : "Validaremos este convite ao criar sua conta."}
            </p>
          </div>
        )}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-border/15 bg-background/60 p-1">
          {(["fisica", "juridica"] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => {
                setTipoPessoa(tipo);
                setDocumento("");
                setErroDocumento(null);
              }}
              className={`h-10 rounded-lg text-sm font-semibold transition-all ${
                tipoPessoa === tipo ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:text-foreground"
              }`}
            >
              {tipo === "fisica" ? "Pessoa física" : "Pessoa jurídica"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Input
            id="nome"
            label={tipoPessoa === "fisica" ? "Nome completo" : "Razão social"}
            required
            minLength={2}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            id="documento"
            label={tipoPessoa === "fisica" ? "CPF" : "CNPJ"}
            required
            inputMode="numeric"
            placeholder={tipoPessoa === "fisica" ? "000.000.000-00" : "00.000.000/0001-00"}
            value={documento}
            onChange={(e) => onDocumentoChange(e.target.value)}
            onBlur={onDocumentoBlur}
            error={erroDocumento ?? undefined}
          />
          {tipoPessoa === "fisica" && (
            <Input
              id="dataNascimento"
              label="Data de nascimento"
              type="date"
              required
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          )}
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="telefone"
            label="Telefone"
            type="tel"
            required
            inputMode="numeric"
            placeholder="(11) 90000-0000"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
          />
          <Input
            id="senha"
            label="Senha"
            type="password"
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Input
            id="confirmarSenha"
            label="Confirmar senha"
            type="password"
            required
            minLength={8}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            onBlur={onConfirmarSenhaBlur}
            error={erroConfirmarSenha ?? undefined}
          />
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <Button type="submit" loading={enviando} className="mt-1 w-full">
            Criar conta
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border/15" />
          <span className="text-xs text-muted">ou</span>
          <span className="h-px flex-1 bg-border/15" />
        </div>
        <GoogleLoginButton texto="Criar conta com Google" />
        <p className="mt-4 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
