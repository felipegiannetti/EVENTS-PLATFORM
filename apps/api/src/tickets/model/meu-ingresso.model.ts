import { IngressoModel } from "./ingresso.model";

/** Ingresso + dados do evento denormalizados — usado só na listagem "Meus ingressos" do comprador, que precisa mostrar nome/data do evento sem uma segunda chamada por ingresso. */
export class MeuIngressoModel extends IngressoModel {
  constructor(
    ingresso: IngressoModel,
    public readonly eventoNome: string,
    public readonly eventoData: Date,
  ) {
    super(
      ingresso.id,
      ingresso.eventoId,
      ingresso.loteId,
      ingresso.linkVendaId,
      ingresso.status,
      ingresso.qrToken,
      ingresso.transferivel,
      ingresso.compradorNome,
      ingresso.compradorEmail,
      ingresso.compradorDocumento,
      ingresso.cupomDescontoId,
      ingresso.cupomCodigo,
      ingresso.criadoEm,
    );
  }
}
