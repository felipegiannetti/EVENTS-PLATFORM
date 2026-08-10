import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class SenhaCupomInvalidaException extends DomainException {
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
  readonly code = "SENHA_CUPOM_INVALIDA";

  constructor() {
    super("Senha incorreta para este cupom.");
  }
}
