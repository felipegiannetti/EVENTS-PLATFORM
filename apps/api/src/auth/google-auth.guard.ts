import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Dispara a GoogleStrategy — usado tanto pra iniciar o redirect (/auth/google) quanto pro callback. */
@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {}
