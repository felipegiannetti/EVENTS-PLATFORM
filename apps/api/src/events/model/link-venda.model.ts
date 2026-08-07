export class LinkVendaModel {
  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly slug: string,
    public readonly origem: string,
  ) {}
}
