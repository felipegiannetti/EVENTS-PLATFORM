import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class PrazoTransferenciaExpiradoException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;
  readonly code = "PRAZO_TRANSFERENCIA_EXPIRADO";

  /** `motivo` diferencia a trava base (evento já começou) do prazo específico configurado pelo organizador — mensagem genérica cobre os dois casos se omitido. */
  constructor(motivo?: "evento_iniciado" | "prazo_configurado") {
    const mensagem =
      motivo === "evento_iniciado"
        ? "Não é mais possível transferir este ingresso — o evento já começou (ou já terminou)."
        : motivo === "prazo_configurado"
          ? "O prazo para transferir este ingresso já passou — o organizador definiu um limite antes do evento."
          : "O prazo para transferir este ingresso já passou.";
    super(mensagem);
  }
}
