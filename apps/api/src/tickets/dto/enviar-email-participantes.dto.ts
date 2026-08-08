import { createZodDto } from "nestjs-zod";
import { enviarEmailParticipantesSchema } from "@events-platform/shared-types";

export class EnviarEmailParticipantesDto extends createZodDto(enviarEmailParticipantesSchema) {}
