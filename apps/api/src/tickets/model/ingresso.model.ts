import type { StatusIngresso } from "@events-platform/shared-types";

export class IngressoModel {
  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly loteId: string,
    public readonly linkVendaId: string | null,
    public readonly status: StatusIngresso,
    public readonly qrToken: string,
    public readonly transferivel: boolean,
    public readonly compradorNome: string | null,
    public readonly compradorEmail: string | null,
    public readonly compradorDocumento: string | null,
    public readonly cupomDescontoId: string | null,
    public readonly cupomCodigo: string | null,
    public readonly criadoEm: Date,
  ) {}
}
