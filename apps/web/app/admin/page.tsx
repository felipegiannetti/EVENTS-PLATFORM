import Link from "next/link";
import { LandmarkIcon, LifeBuoy, ListChecks, ToggleLeft, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

const SECOES = [
  { href: "/admin/suporte", label: "Suporte", icon: LifeBuoy, descricao: "Busque qualquer evento de qualquer organizador e veja ingressos e check-in, em modo leitura." },
  { href: "/admin/acordos", label: "Administrador", icon: LandmarkIcon, descricao: "Acordos comerciais — quanto da taxa de 12% vai para cada organizador." },
  { href: "/admin/sistema", label: "Sistema", icon: ToggleLeft, descricao: "Ligue e desligue funcionalidades da plataforma, e reative quando quiser." },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet, descricao: "Consolidado de vendas, taxa retida e repasse estimado por evento." },
  { href: "/admin/auditoria", label: "Auditoria", icon: ListChecks, descricao: "Histórico de ações administrativas e eventos de autenticação sensíveis." },
];

export default function AdminOverviewPage() {
  return (
    <main className="page-shell max-w-5xl">
      <span className="eyebrow">Painel do admin</span>
      <h1 className="page-title">Visão geral</h1>
      <p className="page-description">Escolha uma área para continuar.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {SECOES.map((secao) => {
          const Icon = secao.icon;
          return (
            <Link key={secao.href} href={secao.href}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-foreground">{secao.label}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted">{secao.descricao}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
