import { randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import type {
  CriarProgramaIndicacaoInput,
  OfertaIndicacaoPublicaResponse,
  OfertaIndicacaoResponse,
  PainelIndicacaoResponse,
  ProgramaIndicacaoResponse,
} from "@events-platform/shared-types";
import { PrismaService } from "../infra/prisma/prisma.service";
import { criptografar, descriptografar } from "../infra/crypto/campo-criptografado.util";

const BENEFICIO_MAXIMO_ORGANIZADOR = 2;
const PARTICIPACAO_BONUS_INDICADOR = 0.25;

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async criarPrograma(usuarioId: string, input: CriarProgramaIndicacaoInput): Promise<ProgramaIndicacaoResponse> {
    const [usuario, existente] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { senhaHash: true } }),
      this.prisma.programaIndicacao.findUnique({ where: { usuarioId }, select: { id: true } }),
    ]);
    if (!usuario || !(await argon2.verify(usuario.senhaHash, input.senhaAtual))) {
      throw new UnauthorizedException("Senha atual inválida.");
    }
    if (existente) {
      throw new ConflictException("Você já possui um programa de indicação.");
    }

    const chave = this.chave();
    await this.prisma.programaIndicacao.create({
      data: {
        usuarioId,
        banco: input.banco,
        tipoConta: input.tipoConta,
        agencia: criptografar(input.agencia, chave),
        conta: criptografar(input.conta, chave),
        titular: criptografar(input.titular, chave),
        documentoTitular: criptografar(input.documentoTitular, chave),
      },
    });
    return (await this.buscarPainel(usuarioId)).programa!;
  }

  async criarOferta(usuarioId: string, percentual: number): Promise<OfertaIndicacaoResponse> {
    if (percentual < 0 || percentual > BENEFICIO_MAXIMO_ORGANIZADOR) {
      throw new BadRequestException("O benefício do organizador deve ficar entre 0% e 2%.");
    }
    const programa = await this.prisma.programaIndicacao.findUnique({ where: { usuarioId } });
    if (!programa?.ativo) {
      throw new BadRequestException("Cadastre sua conta de repasse antes de criar um link.");
    }
    const oferta = await this.prisma.ofertaIndicacao.create({
      data: {
        programaId: programa.id,
        codigo: randomBytes(12).toString("base64url"),
        percentualBeneficioOrganizador: percentual,
      },
    });
    return this.mapearOferta(oferta);
  }

  async buscarOfertaPublica(codigo: string): Promise<OfertaIndicacaoPublicaResponse> {
    const oferta = await this.prisma.ofertaIndicacao.findFirst({
      where: { codigo, ativo: true, programa: { ativo: true } },
      select: {
        percentualBeneficioOrganizador: true,
        programa: { select: { usuario: { select: { nome: true } } } },
      },
    });
    if (!oferta) throw new NotFoundException("Link de indicação inválido ou desativado.");
    return {
      indicadorNome: oferta.programa.usuario.nome.split(" ")[0] ?? oferta.programa.usuario.nome,
      percentualBeneficioOrganizador: Number(oferta.percentualBeneficioOrganizador),
    };
  }

  async buscarPainel(usuarioId: string): Promise<PainelIndicacaoResponse> {
    const [programa, indicacoes] = await Promise.all([
      this.prisma.programaIndicacao.findUnique({
        where: { usuarioId },
        include: { ofertas: { orderBy: { criadoEm: "desc" } }, usuario: { select: { nome: true } } },
      }),
      this.prisma.indicacao.findMany({
        where: { indicadorId: usuarioId },
        include: {
          indicado: {
            select: {
              nome: true,
              eventosOrganizados: {
                orderBy: [{ data: "asc" }, { id: "asc" }],
                select: {
                  id: true,
                  nome: true,
                  ingressos: {
                    where: { status: { not: "cancelado" }, lote: { preco: { gt: 0 } } },
                    select: { lote: { select: { preco: true } } },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const eventos = indicacoes.flatMap((indicacao) => {
      const elegiveis = indicacao.indicado.eventosOrganizados
        .map((evento) => ({ ...evento, baseCalculo: evento.ingressos.reduce((soma, ingresso) => soma + Number(ingresso.lote.preco), 0) }))
        .filter((evento) => evento.baseCalculo > 0);
      const beneficio = Number(indicacao.percentualBeneficioOrganizador);
      const percentualBonus = this.percentualBonus(beneficio);
      return elegiveis.map((evento, indice) => {
        const percentualBase = indice === 0 ? 1 : 0.25;
        const percentualTotal = percentualBase + percentualBonus;
        return {
          eventoId: evento.id,
          eventoNome: evento.nome,
          organizadorNome: indicacao.indicado.nome,
          primeiroEventoPago: indice === 0,
          percentualBase,
          percentualBonus,
          percentualTotal,
          percentualBeneficioOrganizador: beneficio,
          baseCalculo: evento.baseCalculo,
          valorEstimado: evento.baseCalculo * (percentualTotal / 100),
        };
      });
    });

    return {
      programa: programa ? this.mapearPrograma(programa) : null,
      totalIndicados: indicacoes.length,
      totalEventosPagos: eventos.length,
      totalEstimado: eventos.reduce((soma, evento) => soma + evento.valorEstimado, 0),
      eventos,
    };
  }

  percentualBonus(percentualBeneficioOrganizador: number): number {
    return (BENEFICIO_MAXIMO_ORGANIZADOR - percentualBeneficioOrganizador) * PARTICIPACAO_BONUS_INDICADOR;
  }

  private mapearPrograma(programa: {
    id: string;
    banco: string;
    conta: string;
    tipoConta: "corrente" | "poupanca";
    titular: string;
    ativo: boolean;
    ofertas: Array<{ id: string; codigo: string; percentualBeneficioOrganizador: unknown; ativo: boolean; criadoEm: Date }>;
  }): ProgramaIndicacaoResponse {
    const chave = this.chave();
    const conta = descriptografar(programa.conta, chave).replace(/\D/g, "");
    return {
      id: programa.id,
      banco: programa.banco,
      contaFinal: conta.slice(-4).padStart(4, "•"),
      tipoConta: programa.tipoConta,
      titular: descriptografar(programa.titular, chave),
      ativo: programa.ativo,
      ofertas: programa.ofertas.map((oferta) => this.mapearOferta(oferta)),
    };
  }

  private mapearOferta(oferta: { id: string; codigo: string; percentualBeneficioOrganizador: unknown; ativo: boolean; criadoEm: Date }): OfertaIndicacaoResponse {
    return {
      id: oferta.id,
      codigo: oferta.codigo,
      percentualBeneficioOrganizador: Number(oferta.percentualBeneficioOrganizador),
      ativo: oferta.ativo,
      criadoEm: oferta.criadoEm.toISOString(),
    };
  }

  private chave(): string {
    return this.config.getOrThrow<string>("CONTA_BANCARIA_ENCRYPTION_KEY");
  }
}
