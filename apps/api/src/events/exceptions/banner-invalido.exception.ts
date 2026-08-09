import { HttpStatus } from "@nestjs/common";
import { DomainException } from "../../common/exceptions/domain-exception.base";

export class BannerInvalidoException extends DomainException {
  readonly httpStatus = HttpStatus.BAD_REQUEST;
  readonly code = "BANNER_INVALIDO";

  constructor(message: string) {
    super(message);
  }
}
