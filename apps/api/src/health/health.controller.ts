import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../infra/prisma/prisma.service";
import { Public } from "../security/decorators/public.decorator";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    let database: "up" | "down" = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    return { status: "ok", database };
  }
}
