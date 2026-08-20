import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class DocumentoJaDefinidoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "DOCUMENTO_JA_DEFINIDO";

  constructor() {
    super("Sua conta já tem CPF/CNPJ cadastrado — não pode ser alterado.");
  }
}
