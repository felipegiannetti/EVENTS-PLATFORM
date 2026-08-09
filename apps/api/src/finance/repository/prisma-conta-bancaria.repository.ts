import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ContaBancaria } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { criptografar, descriptografar } from "../../infra/crypto/campo-criptografado.util";
import { ContaBancariaModel } from "../model/conta-bancaria.model";
import type {
  ContaBancariaRepository,
  UpsertContaBancariaData,
} from "./conta-bancaria.repository";

/**
 * agencia/conta/documentoTitular/titular são criptografados (reversível, não hash) antes de
 * gravar — o futuro gateway de pagamento precisa do valor real, então hash (mão única) não
 * serviria aqui. `banco` fica em texto puro por ser só um código Febraban, não um dado sensível.
 * Ver docs/architecture/09-modelo-financeiro.md.
 */
@Injectable()
export class PrismaContaBancariaRepository implements ContaBancariaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async upsert(data: UpsertContaBancariaData): Promise<ContaBancariaModel> {
    const chave = this.chave();
    const dadosCriptografados = {
      eventoId: data.eventoId,
      banco: data.banco,
      tipoConta: data.tipoConta,
      agencia: criptografar(data.agencia, chave),
      conta: criptografar(data.conta, chave),
      titular: criptografar(data.titular, chave),
      documentoTitular: criptografar(data.documentoTitular, chave),
    };
    const { eventoId, ...resto } = dadosCriptografados;
    const conta = await this.prisma.contaBancaria.upsert({
      where: { eventoId },
      update: resto,
      create: dadosCriptografados,
    });
    return this.toModel(conta);
  }

  async buscarPorEvento(eventoId: string): Promise<ContaBancariaModel | null> {
    const conta = await this.prisma.contaBancaria.findUnique({ where: { eventoId } });
    return conta ? this.toModel(conta) : null;
  }

  private chave(): string {
    return this.config.getOrThrow<string>("CONTA_BANCARIA_ENCRYPTION_KEY");
  }

  private toModel(conta: ContaBancaria): ContaBancariaModel {
    const chave = this.chave();
    return new ContaBancariaModel(
      conta.eventoId,
      conta.banco,
      descriptografar(conta.agencia, chave),
      descriptografar(conta.conta, chave),
      conta.tipoConta,
      descriptografar(conta.titular, chave),
      descriptografar(conta.documentoTitular, chave),
      conta.atualizadoEm,
    );
  }
}
