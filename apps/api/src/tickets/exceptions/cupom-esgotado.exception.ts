import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class CupomEsgotadoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "CUPOM_ESGOTADO";

  constructor() {
    super(
      "Este cupom já atingiu o limite de usos configurado — pode ser que o último uso tenha acabado de ser registrado por outra emissão. Remova o cupom ou aumente o limite antes de tentar de novo.",
    );
  }
}
