import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class DocumentoJaCadastradoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "DOCUMENTO_JA_CADASTRADO";

  constructor() {
    super("Já existe uma conta com este CPF/CNPJ.");
  }
}
