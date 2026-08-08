import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EmitirIngressoInput } from "@events-platform/shared-types";
import { INGRESSO_REPOSITORY, type IngressoRepository } from "./repository/ingresso.repository";
import { LOTE_REPOSITORY, type LoteRepository } from "../events/repository/lote.repository";
import { IngressoModel } from "./model/ingresso.model";
import type { MeuIngressoModel } from "./model/meu-ingresso.model";
import { LoteEsgotadoException } from "./exceptions/lote-esgotado.exception";
import { IngressoNaoEncontradoException } from "./exceptions/ingresso-nao-encontrado.exception";
import { QrInvalidoException } from "./exceptions/qr-invalido.exception";
import { IngressoJaUtilizadoException } from "./exceptions/ingresso-ja-utilizado.exception";
import { LoteNaoEncontradoException } from "../events/exceptions/lote-nao-encontrado.exception";
import { gerarQrToken, verificarQrToken } from "./qr-token.util";

@Injectable()
export class TicketsService {
  constructor(
    @Inject(INGRESSO_REPOSITORY) private readonly ingressoRepository: IngressoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
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

    const id = randomUUID();
    const qrToken = gerarQrToken(id, this.config.getOrThrow<string>("QR_TOKEN_SECRET"));

    return this.ingressoRepository.criar({
      id,
      eventoId,
      loteId,
      linkVendaId: input.linkVendaId,
      qrToken,
      transferivel: false,
      compradorNome: input.compradorNome,
      compradorEmail: input.compradorEmail,
      compradorDocumento: input.compradorDocumento,
    });
  }

  async listarPorCompradorEmail(email: string): Promise<MeuIngressoModel[]> {
    return this.ingressoRepository.listarPorCompradorEmail(email);
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

  async cancelar(id: string): Promise<IngressoModel> {
    await this.buscar(id);
    return this.ingressoRepository.atualizarStatus(id, "cancelado");
  }

  async listarPorEvento(eventoId: string): Promise<IngressoModel[]> {
    return this.ingressoRepository.listarPorEvento(eventoId);
  }
}
