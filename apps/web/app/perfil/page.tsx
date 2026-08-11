"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CalendarDays, HandCoins, IdCard, KeyRound, MapPin, ShieldCheck, Ticket, Trash2, User } from "lucide-react";
import type { EventoResponse, MeuIngressoResponse, UsuarioResponse } from "@events-platform/shared-types";
import { formatarLocalizacaoEvento, ROTULO_CATEGORIA_EVENTO } from "@events-platform/shared-types";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { alterarEmail, alterarSenha, atualizarPerfil, buscarPerfil, deletarConta } from "@/lib/auth-client";
import { formatarDocumento } from "@/lib/formatters";
import { listarEventos } from "@/lib/events-client";
import { listarMeusIngressos } from "@/lib/tickets-client";
import { useAuth } from "@/lib/auth-context";

type Secao = "dados" | "seguranca" | "organizados" | "participados";

export default function PerfilPage() {
  return <ProtectedPage>{(token) => <Perfil token={token} />}</ProtectedPage>;
}

function Perfil({ token }: { token: string }) {
  const [secao, setSecao] = useState<Secao>("dados");
  const [perfil, setPerfil] = useState<UsuarioResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarPerfil(token)
      .then(setPerfil)
      .catch((err) => setErro(err instanceof ApiError ? err.message : "Não foi possível carregar o perfil."));
  }, [token]);

  if (!perfil) {
    return <p className="p-6 text-sm text-muted">{erro ?? "Carregando..."}</p>;
  }

  const itens: { valor: Secao; label: string; icon: typeof User }[] = [
    { valor: "dados", label: "Dados da conta", icon: User },
    { valor: "seguranca", label: "Segurança", icon: KeyRound },
    { valor: "organizados", label: "Eventos que organizo", icon: CalendarDays },
    { valor: "participados", label: "Eventos que participei", icon: Ticket },
  ];

  return (
    <main className="page-shell max-w-4xl">
      <span className="eyebrow">
        <User size={12} /> Perfil
      </span>
      <h1 className="page-title">Sua conta</h1>
      <p className="page-description">Gerencie seus dados, segurança e histórico de eventos.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {itens.map((item) => (
            <button
              key={item.valor}
              type="button"
              onClick={() => setSecao(item.valor)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all lg:shrink ${
                secao === item.valor ? "bg-primary/10 text-primary" : "text-muted hover:bg-card hover:text-foreground"
              }`}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
          <div className="hidden border-t border-border/10 pt-3 lg:block">
            <Link href="/indicacoes" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted transition-all hover:bg-primary/10 hover:text-primary">
              <HandCoins size={16} /> Indique e ganhe
            </Link>
            {perfil.papelGlobal === "admin_geral" && (
              <Link href="/admin" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted transition-all hover:bg-primary/10 hover:text-primary">
                <ShieldCheck size={16} /> Administração
              </Link>
            )}
          </div>
        </nav>

        <div>
          {secao === "dados" && <SecaoDados perfil={perfil} token={token} onAtualizado={setPerfil} />}
          {secao === "seguranca" && <SecaoSeguranca token={token} />}
          {secao === "organizados" && <SecaoOrganizados token={token} />}
          {secao === "participados" && <SecaoParticipados token={token} />}
        </div>
      </div>
    </main>
  );
}

function SecaoDados({
  perfil,
  token,
  onAtualizado,
}: {
  perfil: UsuarioResponse;
  token: string;
  onAtualizado: (p: UsuarioResponse) => void;
}) {
  const [nome, setNome] = useState(perfil.nome);
  const [dataNascimento, setDataNascimento] = useState(perfil.dataNascimento ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      const atualizado = await atualizarPerfil(
        { nome, dataNascimento: perfil.tipoPessoa === "fisica" ? dataNascimento || undefined : undefined },
        token,
      );
      onAtualizado(atualizado);
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="section-title !text-base">Dados da conta</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-5">
        <Input
          id="nome"
          label={perfil.tipoPessoa === "fisica" ? "Nome completo" : "Razão social"}
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="documento"
            label={perfil.tipoPessoa === "fisica" ? "CPF" : "CNPJ"}
            value={formatarDocumento(perfil.documento, perfil.tipoPessoa)}
            disabled
          />
          {perfil.tipoPessoa === "fisica" && (
            <Input
              id="dataNascimento"
              label="Data de nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          )}
        </div>
        <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted">
          <IdCard size={13} /> {perfil.tipoPessoa === "fisica" ? "CPF" : "CNPJ"} não pode ser alterado — é o documento que identifica sua conta.
        </p>
        {erro && <p className="text-sm text-danger">{erro}</p>}
        {sucesso && <p className="text-sm text-success">Dados atualizados.</p>}
        <Button type="submit" loading={salvando} className="w-full sm:w-fit">
          Salvar alterações
        </Button>
      </form>
    </Card>
  );
}

function SecaoSeguranca({ token }: { token: string }) {
  const router = useRouter();
  const { logout } = useAuth();

  const [novoEmail, setNovoEmail] = useState("");
  const [senhaParaEmail, setSenhaParaEmail] = useState("");
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [sucessoEmail, setSucessoEmail] = useState(false);
  const [salvandoEmail, setSalvandoEmail] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [sucessoSenha, setSucessoSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function onAlterarEmail(e: FormEvent) {
    e.preventDefault();
    setErroEmail(null);
    setSucessoEmail(false);
    setSalvandoEmail(true);
    try {
      await alterarEmail({ novoEmail, senhaAtual: senhaParaEmail }, token);
      setSucessoEmail(true);
      setNovoEmail("");
      setSenhaParaEmail("");
    } catch (err) {
      setErroEmail(err instanceof ApiError ? err.message : "Não foi possível alterar o email.");
    } finally {
      setSalvandoEmail(false);
    }
  }

  async function onAlterarSenha(e: FormEvent) {
    e.preventDefault();
    setErroSenha(null);
    setSucessoSenha(false);
    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }
    setSalvandoSenha(true);
    try {
      await alterarSenha({ senhaAtual, novaSenha }, token);
      setSucessoSenha(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch (err) {
      setErroSenha(err instanceof ApiError ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function onExcluirConta() {
    setErroExclusao(null);
    setExcluindo(true);
    try {
      await deletarConta({ senhaAtual: senhaExclusao }, token);
      await logout();
      router.push("/");
    } catch (err) {
      setErroExclusao(err instanceof ApiError ? err.message : "Não foi possível excluir a conta.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="section-title !text-base">Alterar email</h2>
        <form onSubmit={onAlterarEmail} className="mt-4 flex flex-col gap-4">
          <Input id="novoEmail" label="Novo email" type="email" required value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
          <Input
            id="senhaParaEmail"
            label="Confirme com sua senha atual"
            type="password"
            required
            value={senhaParaEmail}
            onChange={(e) => setSenhaParaEmail(e.target.value)}
          />
          {erroEmail && <p className="text-sm text-danger">{erroEmail}</p>}
          {sucessoEmail && <p className="text-sm text-success">Email atualizado.</p>}
          <Button type="submit" loading={salvandoEmail} className="w-full sm:w-fit">
            Alterar email
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="section-title !text-base">Alterar senha</h2>
        <p className="mt-1 text-sm text-muted">Ao trocar a senha, todas as suas sessões em outros dispositivos são encerradas.</p>
        <form onSubmit={onAlterarSenha} className="mt-4 flex flex-col gap-4">
          <Input id="senhaAtual" label="Senha atual" type="password" required value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="novaSenha" label="Nova senha" type="password" required minLength={8} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            <Input
              id="confirmarNovaSenha"
              label="Confirmar nova senha"
              type="password"
              required
              minLength={8}
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            />
          </div>
          {erroSenha && <p className="text-sm text-danger">{erroSenha}</p>}
          {sucessoSenha && <p className="text-sm text-success">Senha atualizada.</p>}
          <Button type="submit" loading={salvandoSenha} className="w-full sm:w-fit">
            Alterar senha
          </Button>
        </form>
      </Card>

      <Card className="border-danger/20 bg-danger/5 p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-danger">
          <AlertTriangle size={16} /> Excluir conta
        </h2>
        <p className="mt-1 text-sm text-muted">
          Isso é permanente. Se você ainda for responsável (owner) por algum evento, precisa transferir
          ou remover o evento antes de conseguir excluir a conta.
        </p>

        {!mostrarExclusao ? (
          <Button variant="secondary" onClick={() => setMostrarExclusao(true)} className="mt-4 gap-2 text-danger">
            <Trash2 size={16} /> Excluir minha conta
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <Input
              id="senhaExclusao"
              label="Confirme com sua senha para excluir definitivamente"
              type="password"
              value={senhaExclusao}
              onChange={(e) => setSenhaExclusao(e.target.value)}
            />
            {erroExclusao && <p className="text-sm text-danger">{erroExclusao}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setMostrarExclusao(false)} className="flex-1" disabled={excluindo}>
                Cancelar
              </Button>
              <Button onClick={onExcluirConta} loading={excluindo} className="flex-1 !bg-danger !bg-none">
                Excluir definitivamente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function SecaoOrganizados({ token }: { token: string }) {
  const [eventos, setEventos] = useState<EventoResponse[] | null>(null);

  useEffect(() => {
    listarEventos(token).then(setEventos).catch(() => setEventos([]));
  }, [token]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {eventos?.map((evento) => (
        <Link
          key={evento.id}
          href={`/eventos/${evento.id}`}
          className="rounded-2xl border border-border/10 bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/25"
        >
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
            {ROTULO_CATEGORIA_EVENTO[evento.categoria]}
          </span>
          <p className="mt-3 font-medium text-foreground">{evento.nome}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <CalendarDays size={14} className="text-primary" />
            {new Date(evento.data).toLocaleDateString("pt-BR")}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <MapPin size={14} className="text-primary" />
            {formatarLocalizacaoEvento(evento)}
          </p>
        </Link>
      ))}
      {eventos?.length === 0 && <p className="text-sm text-muted">Você ainda não organiza nenhum evento.</p>}
      {eventos === null && <p className="text-sm text-muted">Carregando...</p>}
    </div>
  );
}

function SecaoParticipados({ token }: { token: string }) {
  const [ingressos, setIngressos] = useState<MeuIngressoResponse[] | null>(null);

  useEffect(() => {
    listarMeusIngressos(token).then(setIngressos).catch(() => setIngressos([]));
  }, [token]);

  return (
    <div className="flex flex-col gap-3">
      {ingressos?.map((ingresso) => (
        <Card key={ingresso.id} className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium text-foreground">{ingresso.eventoNome}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <CalendarDays size={14} /> {new Date(ingresso.eventoData).toLocaleString("pt-BR")}
            </p>
          </div>
        </Card>
      ))}
      {ingressos?.length === 0 && (
        <p className="text-sm text-muted">Nenhum ingresso vinculado ao seu email ainda.</p>
      )}
      {ingressos === null && <p className="text-sm text-muted">Carregando...</p>}
    </div>
  );
}
