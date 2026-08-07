import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class AcessoNegadoException extends DomainException {
  readonly httpStatus = HttpStatus.FORBIDDEN;
  readonly code = "ACESSO_NEGADO";

  constructor(message = "Você não tem permissão para esta ação.") {
    super(message);
  }
}
