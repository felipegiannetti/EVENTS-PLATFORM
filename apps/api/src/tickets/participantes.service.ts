import { Inject, Injectable } from "@nestjs/common";
import type { StatusIngresso } from "@events-platform/shared-types";
import { INGRESSO_REPOSITORY, type IngressoRepository } from "./repository/ingresso.repository";
import { LOTE_REPOSITORY, type LoteRepository } from "../events/repository/lote.repository";
import { EVENTO_REPOSITORY, type EventoRepository } from "../events/repository/evento.repository";
import { EventoNaoEncontradoException } from "../events/exceptions/evento-nao-encontrado.exception";
import { NenhumCompradorException } from "./exceptions/nenhum-comprador.exception";
import { MailService } from "../infra/mail/mail.service";
import { escaparHtml } from "../infra/mail/escapar-html.util";
import { montarCsv } from "../common/csv.util";

const ROTULO_STATUS: Record<StatusIngresso, string> = {
  pendente: "Pendente",
  valido: "Aprovado",
  usado: "Check-in feito",
  cancelado: "Cancelado",
  aguardando_aceite: "Aguardando aceite da transferência",
};

@Injectable()
export class ParticipantesService {
  constructor(
    @Inject(INGRESSO_REPOSITORY) private readonly ingressoRepository: IngressoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepository,
    private readonly mailService: MailService,
  ) {}

  /** CSV com uma linha por ingresso — colunas indicadas no cabeçalho, sem dado inventado (ex: sem coluna "check-in em" porque não guardamos esse timestamp separado). */
  async gerarCsvParticipantes(eventoId: string): Promise<string> {
    const [ingressos, lotes] = await Promise.all([
      this.ingressoRepository.listarPorEvento(eventoId),
      this.loteRepository.listarPorEvento(eventoId),
    ]);
    const nomeLote = new Map(lotes.map((lote) => [lote.id, lote.nome]));

    const cabecalho = ["Status", "Participante", "Email", "Documento", "Tipo de ingresso", "Data de emissão", "Código do ingresso"];
    const linhas = ingressos.map((ingresso) => [
      ROTULO_STATUS[ingresso.status],
      ingresso.compradorNome ?? "",
      ingresso.compradorEmail ?? "",
      ingresso.compradorDocumento ?? "",
      nomeLote.get(ingresso.loteId) ?? "",
      ingresso.criadoEm.toISOString(),
      ingresso.id,
    ]);

    return montarCsv(cabecalho, linhas);
  }

  /**
   * Assunto e cabeçalho/rodapé são fixos — o organizador só escreve o corpo (`mensagem`). Envia
   * pra todo email de comprador distinto desse evento, via BCC (não expõe email de um pra outro).
   */
  async enviarEmailParticipantes(eventoId: string, mensagem: string): Promise<{ enviadosPara: number }> {
    const evento = await this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new EventoNaoEncontradoException();
    }

    const emails = await this.ingressoRepository.listarEmailsCompradoresPorEvento(eventoId);
    if (emails.length === 0) {
      throw new NenhumCompradorException();
    }

    const dataFormatada = new Date().toLocaleDateString("pt-BR");
    const nomeEvento = escaparHtml(evento.nome);
    const mensagemEscapada = escaparHtml(mensagem).replace(/\n/g, "<br>");
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <p style="display:inline-block;margin:0 0 16px;padding:6px 14px;border-radius:999px;background:#f0e8ff;color:#6d28d9;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
          Email · ${nomeEvento} · ${dataFormatada}
        </p>
        <p style="font-size:15px;line-height:1.6;color:#16152a;">${mensagemEscapada}</p>
        <hr style="border:none;border-top:1px solid #e5e0f5;margin:24px 0 12px;">
        <p style="font-size:12px;color:#666">Você está recebendo este email porque tem um ingresso para este evento na RARO Tickets.</p>
      </div>
    `;

    await this.mailService.enviar({
      para: emails,
      assunto: `[RARO Tickets] Atualização sobre o evento ${evento.nome}`,
      html,
    });

    return { enviadosPara: emails.length };
  }
}
