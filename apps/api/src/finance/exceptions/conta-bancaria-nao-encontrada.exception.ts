import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class ContaBancariaNaoEncontradaException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "CONTA_BANCARIA_NAO_ENCONTRADA";

  constructor() {
    super("Nenhuma conta de repasse cadastrada ainda.");
  }
}
