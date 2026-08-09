import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import { SmtpNaoConfiguradoException } from "./exceptions/smtp-nao-configurado.exception";

interface EnviarEmailInput {
  para: string[];
  assunto: string;
  html: string;
}

/**
 * SMTP configurado via env (MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS/MAIL_FROM). Sem transporte
 * "de mentira" — se não estiver configurado, falha com um erro claro em vez de fingir que enviou
 * (mesma filosofia de nunca inventar dado usada no restante da plataforma).
 */
@Injectable()
export class MailService {
  private transportador: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async enviar(input: EnviarEmailInput): Promise<void> {
    const transportador = this.obterTransportador();
    await transportador.sendMail({
      from: this.config.getOrThrow<string>("MAIL_FROM"),
      bcc: input.para,
      subject: input.assunto,
      html: input.html,
    });
  }

  private obterTransportador(): Transporter {
    if (this.transportador) {
      return this.transportador;
    }
    const host = this.config.get<string>("MAIL_HOST");
    if (!host) {
      throw new SmtpNaoConfiguradoException();
    }
    this.transportador = createTransport({
      host,
      port: Number(this.config.get("MAIL_PORT") ?? 587),
      secure: this.config.get("MAIL_SECURE") === "true",
      auth: this.config.get("MAIL_USER")
        ? { user: this.config.getOrThrow<string>("MAIL_USER"), pass: this.config.getOrThrow<string>("MAIL_PASS") }
        : undefined,
    });
    return this.transportador;
  }
}
