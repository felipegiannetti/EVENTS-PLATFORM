import type { CategoriaEvento, TaxaPagaPor } from "@events-platform/shared-types";

export class EventoModel {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly data: Date,
    public readonly cidade: string | null,
    public readonly estado: string | null,
    public readonly pais: string | null,
    public readonly categoria: CategoriaEvento,
    public readonly transferivel: boolean,
    public readonly taxaPagaPor: TaxaPagaPor,
    public readonly criadoEm: Date,
  ) {}
}
