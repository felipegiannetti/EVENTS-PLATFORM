import type { CategoriaEvento, TaxaPagaPor } from "@events-platform/shared-types";

export class EventoModel {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly data: Date,
    public readonly dataFim: Date | null,
    public readonly cidade: string | null,
    public readonly estado: string | null,
    public readonly pais: string | null,
    public readonly rua: string | null,
    public readonly numero: string | null,
    public readonly complemento: string | null,
    public readonly bairro: string | null,
    public readonly cep: string | null,
    public readonly somenteMaioresDeIdade: boolean,
    public readonly categoria: CategoriaEvento,
    public readonly transferivel: boolean,
    /** Só tem efeito quando transferivel=true. null = sem limite de prazo. */
    public readonly prazoTransferenciaHoras: number | null,
    public readonly taxaPagaPor: TaxaPagaPor,
    /** Visibilidade pra COMPRADORES, não se o evento está "pronto" — o evento existe por completo independente disso. false = privado, não aparece em GET /events/public. */
    public readonly publicado: boolean,
    public readonly descricao: string | null,
    public readonly contatoNome: string | null,
    public readonly contatoEmail: string | null,
    public readonly contatoTelefone: string | null,
    /** Só indica presença — os bytes do banner nunca entram no Model de listagem, ver EventoRepository.buscarBanner. */
    public readonly temBanner: boolean,
    public readonly criadoEm: Date,
  ) {}
}
