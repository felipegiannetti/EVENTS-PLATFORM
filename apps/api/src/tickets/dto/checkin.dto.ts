import { createZodDto } from "nestjs-zod";
import { checkinSchema } from "@events-platform/shared-types";

export class CheckinDto extends createZodDto(checkinSchema) {}
