import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { Prisma } from "@prisma/client";
import { DomainException } from "./domain-exception.base";

interface ErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** Equivalente ao @ControllerAdvice do Spring: único lugar que traduz qualquer exceção (de domínio, do Nest ou do Prisma) para uma resposta HTTP consistente. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof DomainException) {
      return {
        status: exception.httpStatus,
        body: { error: { code: exception.code, message: exception.message } },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        return {
          status: HttpStatus.CONFLICT,
          body: { error: { code: "REGISTRO_DUPLICADO", message: "Registro já existe." } },
        };
      }
      if (exception.code === "P2025") {
        return {
          status: HttpStatus.NOT_FOUND,
          body: { error: { code: "NAO_ENCONTRADO", message: "Registro não encontrado." } },
        };
      }
    }

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      const message =
        typeof responseBody === "string"
          ? responseBody
          : ((responseBody as { message?: string | string[] }).message ?? exception.message);
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: exception.constructor.name.replace("Exception", "").toUpperCase(),
            message: Array.isArray(message) ? message.join("; ") : message,
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: { code: "ERRO_INTERNO", message: "Erro interno do servidor." } },
    };
  }
}
