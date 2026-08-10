/// <reference lib="dom" />
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import { escaparHtml } from "../../infra/mail/escapar-html.util";

export interface DadosIngressoPdf {
  eventoNome: string;
  eventoDataFormatada: string;
  enderecoEvento: string;
  codigoCompra: string;
  compradorNome: string;
  compradorEmail: string;
  dataCompraFormatada: string;
  tipoIngresso: string | null;
  qrToken: string;
}

/** HTML autocontido (sem CSS externo) — puppeteer renderiza isso pra PDF. Mesma linha visual dos emails (roxo RARO Tickets). */
async function montarHtmlIngresso(dados: DadosIngressoPdf): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(dados.qrToken, { width: 260, margin: 1 });
  const nomeEvento = escaparHtml(dados.eventoNome);
  const endereco = escaparHtml(dados.enderecoEvento);
  const nomeComprador = escaparHtml(dados.compradorNome);
  const emailComprador = escaparHtml(dados.compradorEmail);
  const codigoCompra = escaparHtml(dados.codigoCompra);
  const tipoIngresso = dados.tipoIngresso ? escaparHtml(dados.tipoIngresso) : null;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; background: #ffffff; padding: 32px; }
          .ticket { border: 1px solid #e5e0f5; border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #6d28d9, #8b5cf6); color: #ffffff; padding: 28px 32px; }
          .header .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85; }
          .header h1 { font-size: 24px; margin-top: 6px; }
          .body { display: flex; gap: 28px; padding: 28px 32px; }
          .info { flex: 1; }
          .info dt { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-top: 16px; }
          .info dt:first-child { margin-top: 0; }
          .info dd { font-size: 14px; color: #16152a; margin-top: 2px; }
          .qr-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; border: 1px dashed #d8d0f0; border-radius: 16px; }
          .qr-box img { width: 160px; height: 160px; }
          .qr-box .legenda { margin-top: 8px; font-size: 10px; letter-spacing: 0.04em; color: #888; text-align: center; word-break: break-all; max-width: 170px; }
          .footer { border-top: 1px solid #eee; padding: 16px 32px; font-size: 11px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <p class="eyebrow">Seu ingresso — RARO Tickets</p>
            <h1>${nomeEvento}</h1>
          </div>
          <div class="body">
            <dl class="info">
              <dt>Quando</dt>
              <dd>${dados.eventoDataFormatada}</dd>
              <dt>Onde</dt>
              <dd>${endereco}</dd>
              ${tipoIngresso ? `<dt>Tipo de ingresso</dt><dd>${tipoIngresso}</dd>` : ""}
              <dt>Participante</dt>
              <dd>${nomeComprador}</dd>
              <dt>Email</dt>
              <dd>${emailComprador}</dd>
              <dt>Data da compra</dt>
              <dd>${dados.dataCompraFormatada}</dd>
              <dt>Código da compra</dt>
              <dd>${codigoCompra}</dd>
            </dl>
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR code do ingresso" />
              <p class="legenda">${codigoCompra}</p>
            </div>
          </div>
          <div class="footer">Apresente este QR code na entrada do evento.</div>
        </div>
      </body>
    </html>
  `;
}

/** Chrome headless é iniciado e fechado por chamada — volume de emissão é baixo (manual), não justifica manter instância viva. */
export async function gerarPdfIngresso(dados: DadosIngressoPdf): Promise<Buffer> {
  const html = await montarHtmlIngresso(dados);
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const pagina = await browser.newPage();
    await pagina.setViewport({ width: 700, height: 420 });
    await pagina.setContent(html, { waitUntil: "load" });
    // O conteúdo do ticket é dinâmico (endereço, tipo de ingresso etc. variam de tamanho) — medir a
    // altura real depois de renderizado evita que o PDF force um page-break no meio do cartão (o que
    // já aconteceu com uma altura fixa: o QR code e o rodapé acabavam cortados e duplicados numa 2ª página).
    const alturaConteudo = await pagina.evaluate(() => document.body.scrollHeight);
    const pdf = await pagina.pdf({ width: "700px", height: `${alturaConteudo}px`, printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
