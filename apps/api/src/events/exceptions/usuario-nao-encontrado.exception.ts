import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class UsuarioNaoEncontradoException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;
  readonly code = "USUARIO_NAO_ENCONTRADO";

  constructor() {
    super("Não existe usuário cadastrado com esse email.");
  }
}
