import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class CupomComUsosException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "CUPOM_COM_USOS";

  constructor() {
    super("Este cupom já foi usado em pelo menos uma emissão — desative-o em vez de remover, pra não perder o histórico.");
  }
}
