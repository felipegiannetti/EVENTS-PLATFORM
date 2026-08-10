import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

/** Reserva expirada, já confirmada ou já cancelada — não dá mais pra confirmar/cancelar. */
export class ReservaNaoDisponivelException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "RESERVA_NAO_DISPONIVEL";

  constructor() {
    super("Esta reserva expirou ou já foi processada — a vaga não está mais garantida.");
  }
}
