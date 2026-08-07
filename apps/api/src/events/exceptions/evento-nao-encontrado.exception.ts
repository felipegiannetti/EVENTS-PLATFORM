import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class EventoNaoEncontradoException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "EVENTO_NAO_ENCONTRADO";

  constructor() {
    super("Evento não encontrado.");
  }
}
