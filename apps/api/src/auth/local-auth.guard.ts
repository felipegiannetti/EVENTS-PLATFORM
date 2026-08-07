import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Dispara a LocalStrategy (validação de email/senha) só no endpoint de login. */
@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {}
