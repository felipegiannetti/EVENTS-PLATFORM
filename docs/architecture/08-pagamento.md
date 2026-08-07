[← Voltar ao índice](README.md)

# Pagamento

- Módulo `checkout` desenhado com **padrão adapter** — interface única de gateway, para permitir trocar/adicionar provedor sem reescrever o fluxo de compra.
- Gateway escolhido para o lançamento: **Asaas** — taxas competitivas, PIX + boleto + cartão, split de pagamento nativo (útil para repasse de comissão a promoters), API simples e implementação rápida, boa relação custo/benefício para startup.
- Por estar atrás do padrão adapter, se no futuro um evento de pico muito grande exigir mais robustez de checkout de cartão em alta concorrência, dá para adicionar Mercado Pago ou Pagar.me como gateway alternativo sem reescrever o fluxo de compra — só validar na prática o throughput de cartão do Asaas em pico antes de eventos muito grandes.
- Webhooks processados com deduplicação por `event_id` do gateway (evita processar o mesmo evento duas vezes).

Ver o desenho do split de pagamento e repasse ao organizador em [09-modelo-financeiro.md](09-modelo-financeiro.md).
