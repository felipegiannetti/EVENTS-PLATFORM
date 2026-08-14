import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import cookieParser from "cookie-parser";
import helmet from "helmet";
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
  app.use(
    helmet({
      // API só serve JSON (+ imagens de banner/PDF de ingresso) pro front separado por origem — sem HTML/JS pra travar por CSP.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: { maxAge: 15_552_000, includeSubDomains: true },
    }),
  );
  app.use((_req: import("express").Request, res: import("express").Response, next: () => void) => {
    // Permissions-Policy não tem middleware dedicado no helmet — setado manualmente.
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    next();
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseEnvelopeInterceptor());
  app.enableCors({ origin: origensPermitidas(), credentials: true });

  // Só expõe /docs fora de produção — não faz sentido publicar o mapa da API pra qualquer visitante.
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("RARO Tickets API")
      .setDescription("Documentação da API da plataforma de ingressos RARO Tickets.")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
