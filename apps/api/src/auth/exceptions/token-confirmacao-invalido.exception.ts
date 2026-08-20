import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class TokenConfirmacaoInvalidoException extends DomainException {
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  readonly code = "TOKEN_CONFIRMACAO_INVALIDO";

  constructor() {
    super("Link de confirmação inválido ou expirado.");
  }
}
