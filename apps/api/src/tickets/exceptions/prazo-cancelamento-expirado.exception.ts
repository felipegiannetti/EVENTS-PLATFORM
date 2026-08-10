import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class PrazoCancelamentoExpiradoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "PRAZO_CANCELAMENTO_EXPIRADO";

  constructor() {
    super(
      "Não é mais possível cancelar este ingresso — o prazo de 7 dias corridos após a compra já passou (ou, se o ingresso tiver cancelamento flexível, o evento já começou).",
    );
  }
}
