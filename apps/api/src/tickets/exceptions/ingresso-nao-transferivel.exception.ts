import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class IngressoNaoTransferivelException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "INGRESSO_NAO_TRANSFERIVEL";

  constructor() {
    super("Este ingresso não está disponível para transferência.");
  }
}
