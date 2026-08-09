import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class IngressoJaUtilizadoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "INGRESSO_JA_UTILIZADO";

  constructor() {
    super("Este ingresso já teve check-in feito (ou foi cancelado) — não pode ser usado de novo.");
  }
}
