import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class CupomEsgotadoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "CUPOM_ESGOTADO";

  constructor() {
    super("Este cupom já atingiu o limite de usos configurado.");
  }
}
