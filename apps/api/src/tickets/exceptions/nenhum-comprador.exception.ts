import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class NenhumCompradorException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "NENHUM_COMPRADOR";

  constructor() {
    super("Nenhum ingresso deste evento tem email de comprador cadastrado — não há para quem enviar.");
  }
}
