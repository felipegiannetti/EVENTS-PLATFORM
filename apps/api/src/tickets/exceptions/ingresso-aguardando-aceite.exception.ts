import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class IngressoAguardandoAceiteException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "INGRESSO_AGUARDANDO_ACEITE";

  constructor() {
    super(
      "Este ingresso está com uma transferência pendente de aceite pelo destinatário — não pode ser usado até ser aceito ou cancelado.",
    );
  }
}
