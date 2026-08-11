export class LoteModel {
  constructor(
    public readonly id: string,
    public readonly eventoId: string,
    public readonly nome: string,
    public readonly preco: number,
    public readonly quantidade: number,
    public readonly quantidadeEmitida: number,
    public readonly especial: boolean,
    public readonly oculto: boolean,
  ) {}
}
