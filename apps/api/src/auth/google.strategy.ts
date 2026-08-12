import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy, type Profile } from "passport-google-oauth20";

export interface GooglePerfil {
  googleId: string;
  email: string;
  nome: string;
}

/**
 * Fica em auth/ (não em security/), mesmo racional da LocalStrategy — depende só de config, mas
 * segue a convenção de "estratégia usada só no momento do login" ficar junto do módulo de auth.
 * Client ID/secret vêm de env — se não configurados (dev sem Google OAuth configurado ainda), usa
 * um placeholder: a rota /auth/google existe mas o redirect pro Google falha com erro claro (o
 * Google rejeita client_id inválido), em vez de derrubar o boot da API inteira. passport-oauth2
 * exige um clientID truthy no construtor, então "" quebraria o bootstrap — por isso o placeholder.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID") || "google-oauth-nao-configurado",
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET") || "google-oauth-nao-configurado",
      callbackURL: config.get<string>("GOOGLE_CALLBACK_URL") ?? "http://localhost:3000/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): GooglePerfil {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error("Conta Google sem email público — não é possível cadastrar.");
    }
    return { googleId: profile.id, email, nome: profile.displayName || email };
  }
}
