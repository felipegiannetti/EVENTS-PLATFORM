import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class QrInvalidoException extends DomainException {
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  readonly code = "QR_INVALIDO";

  constructor() {
    super("Esse código não é um ingresso válido — não confere com a assinatura esperada.");
  }
}
