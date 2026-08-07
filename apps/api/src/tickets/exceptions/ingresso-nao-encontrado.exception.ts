import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class IngressoNaoEncontradoException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "INGRESSO_NAO_ENCONTRADO";

  constructor() {
    super("Ingresso não encontrado.");
  }
}
