import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { RolesGuard } from "./guards/roles.guard";
import { EventRoleGuard } from "./guards/event-role.guard";

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, RolesGuard, EventRoleGuard],
  exports: [RolesGuard, EventRoleGuard],
})
export class SecurityModule {}
