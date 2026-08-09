import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class QuantidadeLoteInvalidaException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "QUANTIDADE_LOTE_INVALIDA";

  constructor(quantidadeEmitida: number) {
    super(`Já foram emitidos ${quantidadeEmitida} ingressos deste lote — a quantidade não pode ficar menor que isso.`);
  }
}
