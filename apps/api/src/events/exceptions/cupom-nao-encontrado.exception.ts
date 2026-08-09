import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class CupomNaoEncontradoException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "CUPOM_NAO_ENCONTRADO";

  constructor() {
    super("Cupom de desconto não encontrado.");
  }
}
