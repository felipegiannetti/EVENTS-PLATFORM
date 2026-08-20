import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class EmailNaoConfirmadoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "EMAIL_NAO_CONFIRMADO";

  constructor() {
    super("Confirme seu email antes de continuar. Verifique sua caixa de entrada ou reenvie a confirmação.");
  }
}
