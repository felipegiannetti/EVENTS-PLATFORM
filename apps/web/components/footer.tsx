import Link from "next/link";
import { Globe, Share2, Mail } from "lucide-react";
import { Brand } from "@/components/header";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/10 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Brand />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">Experiências que conectam pessoas, marcas e histórias inesquecíveis.</p>
          <div className="mt-5 flex gap-2">
            {[Globe, Share2, Mail].map((Icon, index) => <span key={index} className="grid h-9 w-9 place-items-center rounded-xl border border-border/10 bg-card text-muted"><Icon size={16} /></span>)}
          </div>
        </div>
        {[
          ["Explore", ["Eventos", "Categorias", "Destaques"]],
          ["Organizadores", ["Criar evento", "Gestão", "Financeiro"]],
          ["Novyx", ["Sobre", "Privacidade", "Ajuda"]],
        ].map(([title, links]) => (
          <div key={title as string}>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <div className="mt-4 flex flex-col gap-3">
              {(links as string[]).map((label) => <Link key={label} href="#" className="text-sm text-muted transition-colors hover:text-primary">{label}</Link>)}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/10 px-5 py-5 text-center text-xs text-muted">© 2026 Novyx. Todos os direitos reservados.</div>
    </footer>
  );
}
