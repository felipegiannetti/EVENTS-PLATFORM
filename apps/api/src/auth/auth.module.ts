import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./local.strategy";
import { GoogleStrategy } from "./google.strategy";
import { UsuarioMapper } from "./mapper/usuario.mapper";
import { USUARIO_REPOSITORY } from "./repository/usuario.repository";
import { PrismaUsuarioRepository } from "./repository/prisma-usuario.repository";
import { REFRESH_TOKEN_REPOSITORY } from "./repository/refresh-token.repository";
import { PrismaRefreshTokenRepository } from "./repository/prisma-refresh-token.repository";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [JwtModule.register({}), forwardRef(() => EventsModule)],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleStrategy,
    UsuarioMapper,
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
  ],
  exports: [AuthService, USUARIO_REPOSITORY],
})
export class AuthModule {}
