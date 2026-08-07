import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { SecurityModule } from "./security/security.module";
import { JwtAuthGuard } from "./security/guards/jwt-auth.guard";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { TicketsModule } from "./tickets/tickets.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    SecurityModule,
    HealthModule,
    AuthModule,
    EventsModule,
    TicketsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
