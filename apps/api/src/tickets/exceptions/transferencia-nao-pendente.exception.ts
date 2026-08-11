import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

/** Tentativa de cancelar/aceitar/recusar uma transferência que já não está mais aguardando aceite (já foi processada por outra ação, ou nunca existiu pra esse usuário). */
export class TransferenciaNaoPendenteException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "TRANSFERENCIA_NAO_PENDENTE";

  constructor() {
    super("Esta transferência não está mais pendente — talvez já tenha sido aceita, recusada ou cancelada.");
  }
}
