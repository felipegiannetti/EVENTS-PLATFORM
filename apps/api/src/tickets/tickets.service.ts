import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AtualizarIngressoInput, EmitirIngressoInput } from "@events-platform/shared-types";
import { formatarEnderecoEvento, podeCancelarSelfService, PRAZO_RESERVA_MINUTOS } from "@events-platform/shared-types";
import { escaparHtml } from "../infra/mail/escapar-html.util";
import { montarCsv } from "../common/csv.util";
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
import { PrazoTransferenciaExpiradoException } from "./exceptions/prazo-transferencia-expirado.exception";
import { PrazoCancelamentoExpiradoException } from "./exceptions/prazo-cancelamento-expirado.exception";
import { RESERVA_REPOSITORY, type ReservaRepository } from "./repository/reserva.repository";
import type { ReservaModel } from "./model/reserva.model";
import { ReservaNaoEncontradaException } from "./exceptions/reserva-nao-encontrada.exception";
import { ReservaNaoDisponivelException } from "./exceptions/reserva-nao-disponivel.exception";
import { TransferenciaNaoPendenteException } from "./exceptions/transferencia-nao-pendente.exception";
import { IngressoAguardandoAceiteException } from "./exceptions/ingresso-aguardando-aceite.exception";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject(INGRESSO_REPOSITORY) private readonly ingressoRepository: IngressoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
    @Inject(EVENTO_REPOSITORY) private readonly eventoRepository: EventoRepository,
    @Inject(CUPOM_DESCONTO_REPOSITORY) private readonly cupomDescontoRepository: CupomDescontoRepository,
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    @Inject(RESERVA_REPOSITORY) private readonly reservaRepository: ReservaRepository,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async emitir(eventoId: string, loteId: string, input: EmitirIngressoInput): Promise<IngressoModel> {
    const lote = await this.loteRepository.buscarPorId(loteId);
    if (!lote || lote.eventoId !== eventoId) {
      throw new LoteNaoEncontradoException();
    }

    if (input.cupomDescontoId) {
      const cupom = await this.cupomDescontoRepository.buscarPorId(input.cupomDescontoId);
      if (!cupom || cupom.eventoId !== eventoId) {
        throw new CupomNaoEncontradoException();
      }
      if (!cupom.ativo) {
        throw new CupomInativoException();
      }
    }

    // Reserva atômica de capacidade — cada UPDATE abaixo é uma única instrução condicional
    // (WHERE ocupadas < quantidade), então duas emissões concorrentes pro mesmo lote/cupom nunca
    // conseguem "passar" as duas na mesma vaga: só uma afeta a linha, a outra recebe false e falha
    // de verdade (LoteEsgotadoException/CupomEsgotadoException), sem depender de ler-decidir-escrever
    // em passos separados (que teria uma corrida real). Ver LoteRepository/CupomDescontoRepository.
    const vagaOcupada = await this.loteRepository.ocuparVagaEmitidaSeDisponivel(loteId);
    if (!vagaOcupada) {
      throw new LoteEsgotadoException();
    }

    if (input.cupomDescontoId) {
      const cupomOk = await this.cupomDescontoRepository.incrementarUsosSeDisponivel(input.cupomDescontoId);
      if (!cupomOk) {
        await this.loteRepository.liberarVagaEmitida(loteId);
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
      cancelamentoFlexivel: input.cancelamentoFlexivel,
      compradorNome: input.compradorNome,
      compradorEmail: input.compradorEmail,
      compradorDocumento: input.compradorDocumento,
      cupomDescontoId: input.cupomDescontoId,
    });

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

  /**
   * Infraestrutura para quando existir checkout self-service (ver docs/architecture/11-roadmap.md) —
   * segura uma vaga do lote por PRAZO_RESERVA_MINUTOS enquanto o comprador "está fazendo a compra".
   * Mesma trava atômica de emitir(): ocuparVagaReservadaSeDisponivel é uma única instrução SQL
   * condicional, então duas reservas concorrentes pro último lugar nunca conseguem as duas passar.
   */
  async reservar(
    eventoId: string,
    loteId: string,
    dados: { compradorEmail?: string; compradorNome?: string; compradorTelefone?: string } = {},
  ): Promise<ReservaModel> {
    const lote = await this.loteRepository.buscarPorId(loteId);
    if (!lote || lote.eventoId !== eventoId || lote.oculto) {
      throw new LoteNaoEncontradoException();
    }

    // Expiração lazy: libera vagas de reservas já vencidas desse lote antes de checar capacidade —
    // sem isso, reservas abandonadas ficariam "prendendo" vagas pra sempre (não há job agendado).
    await this.expirarReservasVencidas(loteId);

    const vagaOcupada = await this.loteRepository.ocuparVagaReservadaSeDisponivel(loteId);
    if (!vagaOcupada) {
      throw new LoteEsgotadoException();
    }

    const id = randomUUID();
    const expiraEm = new Date(Date.now() + PRAZO_RESERVA_MINUTOS * 60 * 1000);
    return this.reservaRepository.criar({ id, loteId, expiraEm, ...dados });
  }

  /** Reservas que nunca viraram ingresso — base do relatório de carrinho abandonado do organizador. */
  async listarCarrinhoAbandonado(eventoId: string) {
    return this.reservaRepository.listarAbandonadasPorEvento(eventoId);
  }

  /** CSV com uma linha por reserva abandonada — mesmo formato de gerarCsvParticipantes. */
  async gerarCsvCarrinhoAbandonado(eventoId: string): Promise<string> {
    const itens = await this.listarCarrinhoAbandonado(eventoId);
    const cabecalho = ["Nome", "Email", "Telefone", "Lote", "Iniciado em", "Expirou em"];
    const linhas = itens.map((item) => [
      item.compradorNome ?? "",
      item.compradorEmail ?? "",
      item.compradorTelefone ?? "",
      item.loteNome,
      item.criadoEm.toISOString(),
      item.expiraEm.toISOString(),
    ]);
    return montarCsv(cabecalho, linhas);
  }

  /** Converte uma reserva ainda válida no ingresso de verdade — mesmo racional de emitir(), mas a vaga já estava garantida (não precisa checar capacidade de novo, só mover o contador). */
  async confirmarReserva(eventoId: string, reservaId: string, input: EmitirIngressoInput): Promise<IngressoModel> {
    const reserva = await this.buscarReserva(reservaId);
    const lote = await this.loteRepository.buscarPorId(reserva.loteId);
    if (!lote || lote.eventoId !== eventoId) {
      throw new ReservaNaoEncontradaException();
    }
    if (reserva.status !== "ativa" || reserva.expiraEm.getTime() < Date.now()) {
      if (reserva.status === "ativa") {
        // Já venceu mas a expiração lazy ainda não tinha rodado pra essa reserva — roda agora.
        await this.expirarReservasVencidas(reserva.loteId);
      }
      throw new ReservaNaoDisponivelException();
    }

    if (input.cupomDescontoId) {
      const cupom = await this.cupomDescontoRepository.buscarPorId(input.cupomDescontoId);
      if (!cupom || cupom.eventoId !== eventoId) {
        throw new CupomNaoEncontradoException();
      }
      if (!cupom.ativo) {
        throw new CupomInativoException();
      }
      const cupomOk = await this.cupomDescontoRepository.incrementarUsosSeDisponivel(input.cupomDescontoId);
      if (!cupomOk) {
        throw new CupomEsgotadoException();
      }
    }

    await this.loteRepository.confirmarVagaReservada(reserva.loteId);
    await this.reservaRepository.atualizarStatus(reservaId, "confirmada");

    const evento = await this.eventoRepository.buscarPorId(eventoId);
    const id = randomUUID();
    const qrToken = gerarQrToken(id, this.config.getOrThrow<string>("QR_TOKEN_SECRET"));

    const ingresso = await this.ingressoRepository.criar({
      id,
      eventoId,
      loteId: reserva.loteId,
      qrToken,
      transferivel: evento?.transferivel ?? false,
      cancelamentoFlexivel: input.cancelamentoFlexivel,
      compradorNome: input.compradorNome,
      compradorEmail: input.compradorEmail,
      compradorDocumento: input.compradorDocumento,
      cupomDescontoId: input.cupomDescontoId,
    });

    try {
      await this.enviarEmailConfirmacao(ingresso);
    } catch (erro) {
      this.logger.warn(`Não foi possível enviar o email de confirmação do ingresso ${id} (reserva ${reservaId}): ${(erro as Error).message}`);
    }

    return ingresso;
  }

  /** Desiste da reserva antes do prazo — libera a vaga na hora, sem esperar os 15 minutos. */
  async cancelarReserva(eventoId: string, reservaId: string): Promise<void> {
    const reserva = await this.buscarReserva(reservaId);
    const lote = await this.loteRepository.buscarPorId(reserva.loteId);
    if (!lote || lote.eventoId !== eventoId) {
      throw new ReservaNaoEncontradaException();
    }
    if (reserva.status !== "ativa") {
      throw new ReservaNaoDisponivelException();
    }

    await this.loteRepository.liberarVagaReservada(reserva.loteId);
    await this.reservaRepository.atualizarStatus(reservaId, "cancelada");
  }

  async buscarReserva(id: string): Promise<ReservaModel> {
    const reserva = await this.reservaRepository.buscarPorId(id);
    if (!reserva) {
      throw new ReservaNaoEncontradaException();
    }
    return reserva;
  }

  /**
   * Expiração lazy — roda sob demanda (chamada antes de reservar/confirmar) em vez de um job
   * agendado, já que não existe fila/scheduler no projeto ainda (ver docs/architecture/11-roadmap.md).
   * Correta mesmo sem cron: nenhuma reserva "vencida" consegue ser confirmada (confirmarReserva
   * sempre revalida expiraEm na hora), essa varredura só libera a vaga pros próximos de verdade.
   */
  async expirarReservasVencidas(loteId: string): Promise<void> {
    const vencidas = await this.reservaRepository.listarAtivasVencidas(loteId, new Date());
    for (const reserva of vencidas) {
      await this.loteRepository.liberarVagaReservada(loteId);
      await this.reservaRepository.atualizarStatus(reserva.id, "expirada");
    }
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

  /**
   * Inicia a transferência — NÃO move o ingresso ainda. O destinatário precisa aceitar explicitamente
   * (ver aceitarTransferencia) antes dele cair na carteira; até lá, o remetente ainda pode desistir
   * (ver cancelarTransferencia) e o ingresso fica com status 'aguardando_aceite' — não usável no
   * check-in nem cancelável via self-service nesse meio-tempo.
   */
  async iniciarTransferencia(id: string, usuarioId: string, destinatarioEmail: string): Promise<void> {
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

    const evento = await this.eventoRepository.buscarPorId(ingresso.eventoId);
    if (evento) {
      // Trava base — nunca permitido depois que o evento já começou, mesmo sem prazo configurado
      // (evento.prazoTransferenciaHoras === null não deveria significar "sem trava nenhuma", só "sem
      // trava ADICIONAL antes do início" — transferir um ingresso pro meio/depois do evento não faz sentido).
      if (Date.now() >= evento.data.getTime()) {
        throw new PrazoTransferenciaExpiradoException("evento_iniciado");
      }
      if (evento.prazoTransferenciaHoras != null) {
        const prazoMs = evento.prazoTransferenciaHoras * 60 * 60 * 1000;
        if (Date.now() > evento.data.getTime() - prazoMs) {
          throw new PrazoTransferenciaExpiradoException("prazo_configurado");
        }
      }
    }

    const iniciado = await this.ingressoRepository.iniciarTransferenciaSePertence(id, proprietario.email, destinatario.email);
    if (!iniciado) {
      throw new IngressoNaoTransferivelException();
    }

    try {
      await this.enviarEmailTransferenciaPendente(iniciado, proprietario.nome);
    } catch (erro) {
      this.logger.warn(`Transferência do ingresso ${id} iniciada, mas o email ao destinatário falhou: ${(erro as Error).message}`);
    }
  }

  /** Remetente desiste antes do destinatário aceitar — o ingresso volta pra 'valido' na carteira de quem enviou. */
  async cancelarTransferencia(id: string, usuarioId: string): Promise<void> {
    const [ingresso, proprietario] = await Promise.all([this.buscar(id), this.usuarioRepository.buscarPorId(usuarioId)]);
    if (!proprietario || ingresso.compradorEmail !== proprietario.email) {
      throw new IngressoNaoEncontradoException();
    }
    if (ingresso.status !== "aguardando_aceite") {
      throw new TransferenciaNaoPendenteException();
    }
    const cancelado = await this.ingressoRepository.cancelarTransferenciaSePertence(id, proprietario.email);
    if (!cancelado) {
      throw new TransferenciaNaoPendenteException();
    }
  }

  /** Destinatário aceita — só agora o ingresso muda de dono de verdade (QR rotacionado, invalida qualquer captura anterior). */
  async aceitarTransferencia(id: string, usuarioId: string): Promise<IngressoModel> {
    const [ingresso, destinatario] = await Promise.all([this.buscar(id), this.usuarioRepository.buscarPorId(usuarioId)]);
    if (!destinatario || ingresso.destinatarioTransferenciaEmail !== destinatario.email) {
      // Mesmo padrão: não revela a quem não é o destinatário que essa transferência existe.
      throw new IngressoNaoEncontradoException();
    }
    if (ingresso.status !== "aguardando_aceite") {
      throw new TransferenciaNaoPendenteException();
    }

    const aceito = await this.ingressoRepository.aceitarTransferenciaSeDestinatario(id, destinatario.email, {
      compradorNome: destinatario.nome,
      compradorEmail: destinatario.email,
      compradorDocumento: destinatario.documento,
      qrToken: gerarQrToken(id, this.config.getOrThrow<string>("QR_TOKEN_SECRET")),
    });
    if (!aceito) {
      throw new TransferenciaNaoPendenteException();
    }

    try {
      await this.enviarEmailConfirmacao(aceito);
    } catch (erro) {
      this.logger.warn(`Transferência do ingresso ${id} aceita, mas o email de confirmação falhou: ${(erro as Error).message}`);
    }
    return aceito;
  }

  /** Destinatário recusa — mesmo efeito de cancelarTransferencia (volta pro remetente), mas iniciado por quem recebeu. */
  async recusarTransferencia(id: string, usuarioId: string): Promise<void> {
    const [ingresso, destinatario] = await Promise.all([this.buscar(id), this.usuarioRepository.buscarPorId(usuarioId)]);
    if (!destinatario || ingresso.destinatarioTransferenciaEmail !== destinatario.email) {
      throw new IngressoNaoEncontradoException();
    }
    if (ingresso.status !== "aguardando_aceite") {
      throw new TransferenciaNaoPendenteException();
    }
    const recusado = await this.ingressoRepository.recusarTransferenciaSeDestinatario(id, destinatario.email);
    if (!recusado) {
      throw new TransferenciaNaoPendenteException();
    }
  }

  /** Transferências que outras pessoas enviaram pra esse usuário e ainda esperam aceite dele. */
  async listarTransferenciasRecebidas(usuarioId: string): Promise<MeuIngressoModel[]> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      return [];
    }
    return this.ingressoRepository.listarTransferenciasPendentesPorDestinatario(usuario.email);
  }

  private async enviarEmailTransferenciaPendente(ingresso: IngressoModel, nomeRemetente: string): Promise<void> {
    if (!ingresso.destinatarioTransferenciaEmail) {
      return;
    }
    const evento = await this.eventoRepository.buscarPorId(ingresso.eventoId);
    if (!evento) {
      return;
    }
    const nomeEvento = escaparHtml(evento.nome);
    const remetente = escaparHtml(nomeRemetente);
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <p style="display:inline-block;margin:0 0 16px;padding:6px 14px;border-radius:999px;background:#f0e8ff;color:#6d28d9;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
          Transferência de ingresso
        </p>
        <p style="font-size:15px;line-height:1.6;color:#16152a;"><strong>${remetente}</strong> quer te transferir o ingresso para <strong>${nomeEvento}</strong>.</p>
        <p style="font-size:14px;line-height:1.6;color:#16152a;">Entre na sua conta na RARO Tickets com este email e acesse "Meus ingressos" &gt; "Transferências recebidas" para aceitar ou recusar.</p>
        <hr style="border:none;border-top:1px solid #e5e0f5;margin:24px 0 12px;">
        <p style="font-size:12px;color:#666">Enquanto você não aceitar, o ingresso continua com quem enviou — nada muda até você decidir.</p>
      </div>
    `;
    await this.mailService.enviar({
      para: [ingresso.destinatarioTransferenciaEmail],
      assunto: `[RARO Tickets] Você recebeu uma transferência de ingresso — ${evento.nome}`,
      html,
    });
  }

  /**
   * Cancelamento self-service — o próprio comprador cancela o ingresso dele, sem depender do organizador.
   * Janela padrão: 7 dias corridos desde a emissão/compra (direito de arrependimento — ver
   * docs/architecture/12-pagamentos-e-repasses.md#42). Ingressos com cancelamentoFlexivel=true podem
   * cancelar a qualquer momento até o evento começar. Não existe reembolso de dinheiro real — não há
   * checkout/pagamento implementado, então isso só invalida o ingresso (ver PRAZO_CANCELAMENTO_PADRAO_DIAS).
   */
  async cancelarSeProprio(id: string, usuarioId: string): Promise<void> {
    const [ingresso, proprietario] = await Promise.all([this.buscar(id), this.usuarioRepository.buscarPorId(usuarioId)]);

    if (!proprietario || ingresso.compradorEmail !== proprietario.email) {
      // Mesmo padrão de iniciarTransferencia(): não revela se um UUID arbitrário pertence a outra pessoa.
      throw new IngressoNaoEncontradoException();
    }
    if (ingresso.status === "aguardando_aceite") {
      throw new IngressoAguardandoAceiteException();
    }

    const evento = await this.eventoRepository.buscarPorId(ingresso.eventoId);
    const podeCancelar = podeCancelarSelfService({
      status: ingresso.status,
      criadoEm: ingresso.criadoEm.toISOString(),
      cancelamentoFlexivel: ingresso.cancelamentoFlexivel,
      eventoData: evento?.data.toISOString() ?? new Date(0).toISOString(),
    });
    if (!podeCancelar) {
      throw new PrazoCancelamentoExpiradoException();
    }

    const cancelado = await this.ingressoRepository.cancelarSePertence(id, proprietario.email);
    if (!cancelado) {
      throw new PrazoCancelamentoExpiradoException();
    }
    if (ingresso.cupomDescontoId) {
      await this.cupomDescontoRepository.decrementarUsos(ingresso.cupomDescontoId);
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
    if (ingresso.status === "aguardando_aceite") {
      throw new IngressoAguardandoAceiteException();
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

  async listarLeiturasCheckin(eventoId: string) {
    const ingressos = await this.ingressoRepository.listarPorEvento(eventoId);
    return ingressos
      .filter((ingresso) => ingresso.status === "usado" && ingresso.usadoEm)
      .sort((a, b) => b.usadoEm!.getTime() - a.usadoEm!.getTime())
      .map((ingresso) => ({
        ingressoId: ingresso.id,
        compradorNome: ingresso.compradorNome,
        compradorEmail: ingresso.compradorEmail,
        usadoEm: ingresso.usadoEm!.toISOString(),
      }));
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
