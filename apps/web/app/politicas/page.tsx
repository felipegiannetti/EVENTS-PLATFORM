import { ArrowLeftRight, CalendarClock, RotateCcw, ShieldCheck } from "lucide-react";
import { PRAZO_CANCELAMENTO_PADRAO_DIAS } from "@events-platform/shared-types";
import { Card } from "@/components/ui/card";

export default function PoliticasPage() {
  return (
    <main className="page-shell max-w-3xl">
      <span className="eyebrow">
        <ShieldCheck size={12} /> Políticas
      </span>
      <h1 className="page-title">Políticas da RARO Tickets</h1>
      <p className="page-description">
        As regras abaixo valem para todo ingresso emitido na plataforma. Como ainda não existe compra
        online (checkout) — hoje todo ingresso é emitido diretamente pelo organizador — nenhuma delas
        envolve movimentação real de dinheiro; elas descrevem a política que já vale hoje sobre o
        ingresso em si, e o que vai valer quando a compra self-service existir.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <RotateCcw size={18} />
            </span>
            <h2 className="text-base font-semibold text-foreground">Cancelamento em até {PRAZO_CANCELAMENTO_PADRAO_DIAS} dias</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Por política da plataforma, o comprador pode cancelar um ingresso em até {PRAZO_CANCELAMENTO_PADRAO_DIAS}{" "}
            dias corridos após a emissão/compra — prazo equivalente ao direito de arrependimento previsto
            no art. 49 do Código de Defesa do Consumidor para compras feitas fora de um estabelecimento
            físico. Depois desse prazo, o cancelamento deixa de ser garantido automaticamente (pode ainda
            acontecer a critério do organizador). Esse cancelamento pode ser feito a qualquer momento em{" "}
            <strong className="text-foreground">Meus ingressos</strong>, direto pelo comprador.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            A taxa de serviço da plataforma não é reembolsada em nenhuma hipótese, mesmo dentro do prazo
            de {PRAZO_CANCELAMENTO_PADRAO_DIAS} dias — só o valor do ingresso em si é elegível a reembolso.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock size={18} />
            </span>
            <h2 className="text-base font-semibold text-foreground">Ingresso com cancelamento flexível</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Alguns ingressos podem ser marcados pelo organizador como <strong className="text-foreground">cancelamento flexível</strong> —
            nesse caso, o prazo de {PRAZO_CANCELAMENTO_PADRAO_DIAS} dias não se aplica: o comprador pode
            cancelar a qualquer momento até o início do evento. Quando existir compra online, essa opção
            deve envolver um adicional de 10% sobre o valor do ingresso (ingresso + taxa de serviço),
            revertido inteiramente à plataforma — nunca ao organizador. Hoje, como não há checkout de
            pagamento implementado, nenhuma cobrança real é feita.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Só o adicional de 10% não é reembolsado ao cancelar — é o preço do direito de cancelar até
            perto do evento, e o direito foi exercido. A taxa de serviço normal, nesse caso, é devolvida
            junto com o valor do ingresso.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight size={18} />
            </span>
            <h2 className="text-base font-semibold text-foreground">Transferência de ingresso</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Cada evento decide se permite transferência de ingresso para outra pessoa — o organizador
            pode inclusive definir um prazo mínimo antes do evento a partir do qual a transferência deixa
            de ser permitida. Quando disponível, a transferência é feita pelo próprio comprador em{" "}
            <strong className="text-foreground">Meus ingressos</strong>, para o email de outra pessoa que já
            tenha uma conta na RARO Tickets. Depois da transferência, o QR code anterior é invalidado e um
            novo é gerado para o novo titular.
          </p>
        </Card>
      </div>
    </main>
  );
}
