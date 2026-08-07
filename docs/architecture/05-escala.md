[← Voltar ao índice](README.md)

# Desenho para escala (5k–25k usuários simultâneos no pico)

1. **Sala de espera virtual (waiting room)**: antes do checkout, usuário recebe posição de fila via Redis (sorted set) e é liberado em lotes — protege o banco de "thundering herd" no lançamento de vendas de shows grandes.
2. **ECS Fargate com autoscaling** (min. 2 tasks multi-AZ, scale por CPU/RPS) — paga só pelo consumo, sem servidor ocioso.
3. **Aurora PostgreSQL Serverless v2** — escala automaticamente por ACU; separar leitura pesada (dashboards/relatórios) via **read replica**, mantendo o caminho de escrita (compra) livre.
4. **ElastiCache Redis** para: cache de disponibilidade de lote, rate limiting, filas (BullMQ) e sala de espera.
5. **Desacoplamento assíncrono do pagamento**: webhook do gateway só grava evento e responde rápido; emissão de ingresso + QR + e-mail rodam em worker (SQS/BullMQ), evitando timeout em pico.
6. **CloudFront + WAF** na frente da API e do site — cache de páginas públicas de evento, regras de bot/rate-limit no momento do "disparo" de vendas.
7. **Idempotency keys** no endpoint de checkout — evita cobrança duplicada em retry de rede.
