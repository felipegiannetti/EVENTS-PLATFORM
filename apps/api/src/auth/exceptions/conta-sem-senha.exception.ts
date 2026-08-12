import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class ContaSemSenhaException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "CONTA_SEM_SENHA";

  constructor() {
    super("Esta conta foi criada com login do Google e não tem senha cadastrada.");
  }
}
