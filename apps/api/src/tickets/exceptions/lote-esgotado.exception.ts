import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class LoteEsgotadoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "LOTE_ESGOTADO";

  constructor() {
    super(
      "Este lote não tem mais ingressos disponíveis — pode ser que a última vaga tenha acabado de ser ocupada por outra pessoa. Tente novamente ou escolha outro lote.",
    );
  }
}
