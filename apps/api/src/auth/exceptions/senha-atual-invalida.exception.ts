import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class SenhaAtualInvalidaException extends DomainException {
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
  readonly code = "SENHA_ATUAL_INVALIDA";

  constructor() {
    super("Senha atual incorreta.");
  }
}
