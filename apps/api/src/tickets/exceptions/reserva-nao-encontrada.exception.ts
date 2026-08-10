import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class ReservaNaoEncontradaException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "RESERVA_NAO_ENCONTRADA";

  constructor() {
    super("Reserva não encontrada.");
  }
}
