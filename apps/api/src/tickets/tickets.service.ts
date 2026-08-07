import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { INGRESSO_REPOSITORY, type IngressoRepository } from "./repository/ingresso.repository";
import { LOTE_REPOSITORY, type LoteRepository } from "../events/repository/lote.repository";
import { IngressoModel } from "./model/ingresso.model";
import { LoteEsgotadoException } from "./exceptions/lote-esgotado.exception";
import { IngressoNaoEncontradoException } from "./exceptions/ingresso-nao-encontrado.exception";
import { LoteNaoEncontradoException } from "../events/exceptions/lote-nao-encontrado.exception";
import { gerarQrToken } from "./qr-token.util";

@Injectable()
export class TicketsService {
  constructor(
    @Inject(INGRESSO_REPOSITORY) private readonly ingressoRepository: IngressoRepository,
    @Inject(LOTE_REPOSITORY) private readonly loteRepository: LoteRepository,
    private readonly config: ConfigService,
  ) {}

  async emitir(
    eventoId: string,
    loteId: string,
    linkVendaId?: string,
  ): Promise<IngressoModel> {
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
      linkVendaId,
      qrToken,
      transferivel: false,
    });
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
