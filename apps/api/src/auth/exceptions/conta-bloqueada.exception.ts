import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class ContaBloqueadaException extends DomainException {
  readonly httpStatus = HttpStatus.TOO_MANY_REQUESTS;
  readonly code = "CONTA_BLOQUEADA";

  constructor(bloqueadoAte: Date) {
    const minutos = Math.max(1, Math.ceil((bloqueadoAte.getTime() - Date.now()) / 60_000));
    super(`Muitas tentativas de login. Tente novamente em ${minutos} minuto(s).`);
  }
}
