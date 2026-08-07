import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class EmailJaCadastradoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "EMAIL_JA_CADASTRADO";

  constructor() {
    super("Já existe uma conta com este email.");
  }
}
