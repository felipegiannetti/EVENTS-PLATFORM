import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class DestinatarioInvalidoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "DESTINATARIO_INVALIDO";

  constructor() {
    super("O ingresso já pertence a essa conta. Informe o email de outra pessoa.");
  }
}
