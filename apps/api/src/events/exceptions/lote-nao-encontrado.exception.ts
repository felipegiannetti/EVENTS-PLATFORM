import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class LoteNaoEncontradoException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "LOTE_NAO_ENCONTRADO";

  constructor() {
    super("Lote não encontrado.");
  }
}
