import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AtualizarIngressoInput, EmitirIngressoInput } from "@events-platform/shared-types";
import { formatarEnderecoEvento } from "@events-platform/shared-types";
import { escaparHtml } from "../infra/mail/escapar-html.util";
import { INGRESSO_REPOSITORY, type IngressoRepository } from "./repository/ingresso.repository";
import { LOTE_REPOSITORY, type LoteRepository } from "../events/repository/lote.repository";
import { EVENTO_REPOSITORY, type EventoRepository } from "../events/repository/evento.repository";
import { CUPOM_DESCONTO_REPOSITORY, type CupomDescontoRepository } from "../events/repository/cupom-desconto.repository";
import { MailService } from "../infra/mail/mail.service";
import { IngressoModel } from "./model/ingresso.model";
import type { MeuIngressoModel } from "./model/meu-ingresso.model";
import { USUARIO_REPOSITORY, type UsuarioRepository } from "../auth/repository/usuario.repository";
import { LoteEsgotadoException } from "./exceptions/lote-esgotado.exception";
import { IngressoNaoEncontradoException } from "./exceptions/ingresso-nao-encontrado.exception";
import { QrInvalidoException } from "./exceptions/qr-invalido.exception";
import { IngressoJaUtilizadoException } from "./exceptions/ingresso-ja-utilizado.exception";
import { CupomInativoException } from "./exceptions/cupom-inativo.exception";
import { CupomEsgotadoException } from "./exceptions/cupom-esgotado.exception";
import { LoteNaoEncontradoException } from "../events/exceptions/lote-nao-encontrado.exception";
import { CupomNaoEncontradoException } from "../events/exceptions/cupom-nao-encontrado.exception";
import { gerarQrToken, verificarQrToken } from "./qr-token.util";
import { gerarPdfIngresso } from "./pdf/ingresso-pdf.util";
import { UsuarioNaoEncontradoException } from "../events/exceptions/usuario-nao-encontrado.exception";
import { IngressoNaoTransferivelException } from "./exceptions/ingresso-nao-transferivel.exception";
import { DestinatarioInvalidoException } from "./exceptions/destinatario-invalido.exception";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject(INGRESSO_REPOSITORY) private readonly ingressoRepository: IngressoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepository,
    @Inject(CUPOM_DESCONTO_REPOSITORY) private readonly cupomDescontoRepository: CupomDescontoRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async emitir(eventoId: string, loteId: string, input: EmitirIngressoInput): Promise<IngressoModel> {
    const lote = await this.loteRepository.buscarPorId(loteId);
    if (!lote || lote.eventoId !== eventoId) {
      throw new LoteNaoEncontradoException();
    }
    if (lote.quantidadeEmitida >= lote.quantidade) {
      throw new LoteEsgotadoException();
    }

    if (input.cupomDescontoId) {
      const cupom = await this.cupomDescontoRepository.buscarPorId(input.cupomDescontoId);
      if (!cupom || cupom.eventoId !== eventoId) {
        throw new CupomNaoEncontradoException();
      }
      if (!cupom.ativo) {
        throw new CupomInativoException();
      }
      if (cupom.limiteUsos !== null && cupom.usos >= cupom.limiteUsos) {
        throw new CupomEsgotadoException();
      }
    }

    const evento = await this.eventoRepository.buscarPorId(eventoId);
    const id = randomUUID();
    const qrToken = gerarQrToken(id, this.config.getOrThrow<string>("QR_TOKEN_SECRET"));

    const ingresso = await this.ingressoRepository.criar({
      id,
      eventoId,
      loteId,
      linkVendaId: input.linkVendaId,
      qrToken,
      transferivel: evento?.transferivel ?? false,
      compradorNome: input.compradorNome,
      compradorEmail: input.compradorEmail,
      compradorDocumento: input.compradorDocumento,
      cupomDescontoId: input.cupomDescontoId,
    });

    if (input.cupomDescontoId) {
      await this.cupomDescontoRepository.incrementarUsos(input.cupomDescontoId);
    }

    // Melhor esforço — o ingresso já foi criado de verdade; se o SMTP não estiver configurado
    // (comum em dev) ou o envio falhar, isso não deve desfazer a emissão. O organizador sempre
    // pode reenviar manualmente depois (reenviarEmail), que aí sim propaga o erro pra UI.
    try {
      await this.enviarEmailConfirmacao(ingresso);
    } catch (erro) {
      this.logger.warn(`Não foi possível enviar o email de confirmação do ingresso ${id}: ${(erro as Error).message}`);
    }

    return ingresso;
  }

  async atualizar(eventoId: string, id: string, input: AtualizarIngressoInput): Promise<IngressoModel> {
    await this.buscarDoEvento(eventoId, id);
    return this.ingressoRepository.atualizarComprador(id, input);
  }

  /** Ação explícita do organizador — ao contrário do envio automático na emissão, aqui o erro (ex: SMTP não configurado) deve mesmo chegar na UI. */
  async reenviarEmail(eventoId: string, id: string): Promise<void> {
    const ingresso = await this.buscarDoEvento(eventoId, id);
    await this.enviarEmailConfirmacao(ingresso);
  }

  private async enviarEmailConfirmacao(ingresso: IngressoModel): Promise<void> {
    if (!ingresso.compradorEmail) {
      return;
    }
    const [evento, lote] = await Promise.all([
      this.eventoRepository.buscarPorId(ingresso.eventoId),
      this.loteRepository.buscarPorId(ingresso.loteId),
    ]);
    if (!evento) {
      return;
    }

    const dataFormatada = new Date(evento.data).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
    const nomeEvento = escaparHtml(evento.nome);
    const endereco = escaparHtml(formatarEnderecoEvento(evento));
    const nomeLote = lote ? escaparHtml(lote.nome) : null;
    const nomeComprador = ingresso.compradorNome ? escaparHtml(ingresso.compradorNome) : "";
    const saudacao = nomeComprador ? `Olá, ${nomeComprador}!` : "Olá!";

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <p style="display:inline-block;margin:0 0 16px;padding:6px 14px;border-radius:999px;background:#f0e8ff;color:#6d28d9;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
          Ingresso confirmado
        </p>
        <p style="font-size:15px;line-height:1.6;color:#16152a;">${saudacao} Seu ingresso para <strong>${nomeEvento}</strong> está confirmado.</p>
        <table style="width:100%;font-size:14px;color:#16152a;margin:16px 0;">
          <tr><td style="padding:4px 0;color:#666;">Evento</td><td style="padding:4px 0;text-align:right;">${nomeEvento}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Quando</td><td style="padding:4px 0;text-align:right;">${dataFormatada}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Onde</td><td style="padding:4px 0;text-align:right;">${endereco}</td></tr>
          ${nomeLote ? `<tr><td style="padding:4px 0;color:#666;">Tipo de ingresso</td><td style="padding:4px 0;text-align:right;">${nomeLote}</td></tr>` : ""}
        </table>
        <hr style="border:none;border-top:1px solid #e5e0f5;margin:24px 0 12px;">
        <p style="font-size:12px;color:#666">Entre na sua conta na RARO Tickets com este mesmo email (${escaparHtml(ingresso.compradorEmail)}) pra ver este e outros ingressos em "Meus ingressos".</p>
      </div>
    `;

    let anexos: { nomeArquivo: string; conteudo: Buffer; tipoConteudo: string }[] | undefined;
    try {
      const pdf = await gerarPdfIngresso({
        eventoNome: evento.nome,
        eventoDataFormatada: dataFormatada,
        enderecoEvento: formatarEnderecoEvento(evento),
        codigoCompra: ingresso.id,
        compradorNome: ingresso.compradorNome ?? "",
        compradorEmail: ingresso.compradorEmail,
        dataCompraFormatada: ingresso.criadoEm.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" }),
        tipoIngresso: lote?.nome ?? null,
        qrToken: ingresso.qrToken,
      });
      anexos = [{ nomeArquivo: `ingresso-${ingresso.id.slice(0, 8)}.pdf`, conteudo: pdf, tipoConteudo: "application/pdf" }];
    } catch (erro) {
      // Melhor esforço — o email em HTML já carrega as informações do ingresso; se a geração do
      // PDF falhar (ex: Chromium indisponível no ambiente), o email ainda vale a pena ser enviado.
      this.logger.warn(`Não foi possível gerar o PDF do ingresso ${ingresso.id}: ${(erro as Error).message}`);
    }

    await this.mailService.enviar({
      para: [ingresso.compradorEmail],
      assunto: `[RARO Tickets] Seu ingresso — ${evento.nome}`,
      html,
      anexos,
    });
  }

  async listarPorCompradorEmail(email: string): Promise<MeuIngressoModel[]> {
    return this.ingressoRepository.listarPorCompradorEmail(email);
  }

  async transferir(id: string, usuarioId: string, destinatarioEmail: string): Promise<void> {
    const [ingresso, proprietario, destinatario] = await Promise.all([
      this.buscar(id),
      this.usuarioRepository.buscarPorId(usuarioId),
      this.usuarioRepository.buscarPorEmail(destinatarioEmail),
    ]);

    if (!proprietario || ingresso.compradorEmail !== proprietario.email) {
      // Não revela se um UUID arbitrário pertence a outra pessoa.
      throw new IngressoNaoEncontradoException();
    }
    if (!destinatario) {
      throw new UsuarioNaoEncontradoException();
    }
    if (destinatario.id === proprietario.id) {
      throw new DestinatarioInvalidoException();
    }
    if (!ingresso.transferivel || ingresso.status !== "valido") {
      throw new IngressoNaoTransferivelException();
    }

    // Rotacionar o QR invalida qualquer captura que o antigo dono tenha guardado.
    const transferido = await this.ingressoRepository.transferirSePertence(id, proprietario.email, {
      compradorNome: destinatario.nome,
      compradorEmail: destinatario.email,
      compradorDocumento: destinatario.documento,
      qrToken: gerarQrToken(id, this.config.getOrThrow<string>("QR_TOKEN_SECRET")),
    });
    if (!transferido) {
      throw new IngressoNaoTransferivelException();
    }

    try {
      await this.enviarEmailConfirmacao(transferido);
    } catch (erro) {
      this.logger.warn(`Ingresso ${id} transferido, mas o email ao destinatário falhou: ${(erro as Error).message}`);
    }
  }

  /** Check-in via scanner — QR assinado (HMAC), validado contra o secret do servidor, nunca confiando no payload decodificado sozinho. */
  async checkin(eventoId: string, qrToken: string): Promise<IngressoModel> {
    const { valido, ingressoId } = verificarQrToken(
      qrToken,
      this.config.getOrThrow<string>("QR_TOKEN_SECRET"),
    );
    if (!valido || !ingressoId) {
      throw new QrInvalidoException();
    }

    const ingresso = await this.ingressoRepository.buscarPorId(ingressoId);
    if (!ingresso || ingresso.eventoId !== eventoId) {
      throw new IngressoNaoEncontradoException();
    }
    if (ingresso.status !== "valido") {
      throw new IngressoJaUtilizadoException();
    }

    const sucesso = await this.ingressoRepository.marcarComoUsadoSeValido(ingressoId);
    if (!sucesso) {
      throw new IngressoJaUtilizadoException();
    }
    return this.buscar(ingressoId);
  }

  async buscar(id: string): Promise<IngressoModel> {
    const ingresso = await this.ingressoRepository.buscarPorId(id);
    if (!ingresso) {
      throw new IngressoNaoEncontradoException();
    }
    return ingresso;
  }

  /**
   * Igual a `buscar`, mas também confere que o ingresso pertence ao evento da rota — sem isso,
   * qualquer organizador com papel em QUALQUER evento poderia ver/editar/cancelar/reenviar o
   * ingresso de outro organizador só sabendo o UUID (que, aliás, vai em texto puro dentro do QR
   * code — ver qr-token.util.ts — então "só sabendo" é mais fácil do que parece: basta ter visto
   * o QR do ingresso de outra pessoa). Mesmo padrão que `checkin()` já usa corretamente.
   */
  async buscarDoEvento(eventoId: string, id: string): Promise<IngressoModel> {
    const ingresso = await this.buscar(id);
    if (ingresso.eventoId !== eventoId) {
      throw new IngressoNaoEncontradoException();
    }
    return ingresso;
  }

  async cancelar(eventoId: string, id: string): Promise<IngressoModel> {
    const ingresso = await this.buscarDoEvento(eventoId, id);
    const cancelado = await this.ingressoRepository.atualizarStatus(id, "cancelado");
    if (ingresso.cupomDescontoId && ingresso.status !== "cancelado") {
      await this.cupomDescontoRepository.decrementarUsos(ingresso.cupomDescontoId);
    }
    return cancelado;
  }

  async listarPorEvento(eventoId: string): Promise<IngressoModel[]> {
    return this.ingressoRepository.listarPorEvento(eventoId);
  }
}
