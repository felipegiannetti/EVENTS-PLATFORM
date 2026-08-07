import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class CredenciaisInvalidasException extends DomainException {
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
  readonly code = "CREDENCIAIS_INVALIDAS";

  constructor() {
    super("Email ou senha inválidos.");
  }
}
