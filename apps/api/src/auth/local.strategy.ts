import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "./auth.service";
import { CredenciaisInvalidasException } from "./exceptions/credenciais-invalidas.exception";
import type { UsuarioModel } from "./model/usuario.model";

/**
 * Fica em auth/ (não em security/) porque depende do AuthService — colocá-la em security/
 * criaria uma dependência circular entre os módulos security e auth.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: "email", passwordField: "senha" });
  }

  async validate(email: string, senha: string): Promise<UsuarioModel> {
    const usuario = await this.authService.validarCredenciais(email, senha);
    if (!usuario) {
      throw new CredenciaisInvalidasException();
    }
    return usuario;
  }
}
