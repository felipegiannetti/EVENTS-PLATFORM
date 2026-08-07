import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * QR assinado (HMAC-SHA256) — nunca decodificado "cru" no app, sempre validado contra o secret
 * do servidor. Formato: `${ingressoId}.${nonce}.${assinatura}`. A validação real de check-in
 * (comparar contra Ingresso.status no banco) fica para o módulo checkin — aqui só assinatura.
 */
export function gerarQrToken(ingressoId: string, secret: string): string {
  const nonce = randomBytes(8).toString("hex");
  const assinatura = assinar(ingressoId, nonce, secret);
  return `${ingressoId}.${nonce}.${assinatura}`;
}

export function verificarQrToken(
  token: string,
  secret: string,
): { valido: boolean; ingressoId?: string } {
  const partes = token.split(".");
  if (partes.length !== 3) {
    return { valido: false };
  }
  const [ingressoId, nonce, assinatura] = partes;
  const esperado = assinar(ingressoId, nonce, secret);

  const bufferEsperado = Buffer.from(esperado, "hex");
  const bufferRecebido = Buffer.from(assinatura, "hex");
  const valido =
    bufferEsperado.length === bufferRecebido.length &&
    timingSafeEqual(bufferEsperado, bufferRecebido);

  return valido ? { valido: true, ingressoId } : { valido: false };
}

function assinar(ingressoId: string, nonce: string, secret: string): string {
  return createHmac("sha256", secret).update(`${ingressoId}.${nonce}`).digest("hex");
}
