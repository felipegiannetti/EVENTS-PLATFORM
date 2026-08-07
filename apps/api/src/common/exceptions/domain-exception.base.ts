import { HttpStatus } from "@nestjs/common";

/** Base para toda exceção de regra de negócio lançada pelos Services — o GlobalExceptionFilter sabe traduzir qualquer subclasse desta para HTTP. */
export abstract class DomainException extends Error {
  abstract readonly httpStatus: HttpStatus;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
