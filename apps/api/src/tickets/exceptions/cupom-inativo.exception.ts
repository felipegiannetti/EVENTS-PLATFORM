import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class CupomInativoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "CUPOM_INATIVO";

  constructor() {
    super("Este cupom está desativado e não pode ser usado numa nova emissão.");
  }
}
