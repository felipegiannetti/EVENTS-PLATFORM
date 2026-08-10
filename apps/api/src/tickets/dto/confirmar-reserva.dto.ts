import { createZodDto } from "nestjs-zod";
import { emitirIngressoSchema } from "@events-platform/shared-types";

/** Mesma forma da emissão manual — confirmar uma reserva também precisa dos dados do comprador. */
export class ConfirmarReservaDto extends createZodDto(emitirIngressoSchema) {}
