import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../../common/exceptions/domain-exception.base";

export class SmtpNaoConfiguradoException extends DomainException {
  readonly httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
  readonly code = "SMTP_NAO_CONFIGURADO";

  constructor() {
    super("Envio de email ainda não está configurado neste ambiente (faltam as variáveis MAIL_HOST/MAIL_USER/MAIL_PASS).");
  }
}
