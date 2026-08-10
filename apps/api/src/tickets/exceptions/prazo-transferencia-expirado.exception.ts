import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class PrazoTransferenciaExpiradoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "PRAZO_TRANSFERENCIA_EXPIRADO";

  constructor() {
    super("O prazo para transferir este ingresso já passou — o organizador definiu um limite de horas antes do evento.");
  }
}
