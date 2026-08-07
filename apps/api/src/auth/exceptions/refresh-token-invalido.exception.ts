import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class RefreshTokenInvalidoException extends DomainException {
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
  readonly code = "REFRESH_TOKEN_INVALIDO";

  constructor(message = "Refresh token inválido ou expirado. Faça login novamente.") {
    super(message);
  }
}
