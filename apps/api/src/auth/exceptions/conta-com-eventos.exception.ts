import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class ContaComEventosException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "CONTA_COM_EVENTOS";

  constructor() {
    super(
      "Você ainda é responsável por pelo menos um evento — transfira o acesso de owner ou remova o evento antes de excluir a conta.",
    );
  }
}
