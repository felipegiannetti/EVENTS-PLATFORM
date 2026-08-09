import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/exceptions/global-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor";

/**
 * `origin: true` + `credentials: true` refletiria QUALQUER origem enquanto ainda aceita cookies
 * (o refresh_token httpOnly) — qualquer site poderia disparar requests autenticados usando a
 * sessão da vítima. Lista fechada, vinda de env — nunca reflete origem arbitrária.
 */
function origensPermitidas(): string[] {
  const configuradas = process.env.WEB_ORIGIN?.split(",").map((origem) => origem.trim()).filter(Boolean);
  return configuradas && configuradas.length > 0 ? configuradas : ["http://localhost:3001"];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use((_req: import("express").Request, res: import("express").Response, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseEnvelopeInterceptor());
  app.enableCors({ origin: origensPermitidas(), credentials: true });

  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
