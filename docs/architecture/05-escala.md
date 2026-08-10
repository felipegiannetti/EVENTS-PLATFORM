[← Voltar ao índice](README.md)

# Desenho para escala (5k–25k usuários simultâneos no pico)

1. **Sala de espera virtual (waiting room)**: antes do checkout, usuário recebe posição de fila via Redis (sorted set) e é liberado em lotes — protege o banco de "thundering herd" no lançamento de vendas de shows grandes.
2. **ECS Fargate com autoscaling** (min. 2 tasks multi-AZ, scale por CPU/RPS) — paga só pelo consumo, sem servidor ocioso.
3. **Aurora PostgreSQL Serverless v2** — escala automaticamente por ACU; separar leitura pesada (dashboards/relatórios) via **read replica**, mantendo o caminho de escrita (compra) livre.
4. **ElastiCache Redis** para: cache de disponibilidade de lote, rate limiting, filas (BullMQ) e sala de espera.
5. **Desacoplamento assíncrono do pagamento**: webhook do gateway só grava evento e responde rápido; emissão de ingresso + QR + e-mail rodam em worker (SQS/BullMQ), evitando timeout em pico.
6. **CloudFront + WAF** na frente da API e do site — cache de páginas públicas de evento, regras de bot/rate-limit no momento do "disparo" de vendas.
7. **Idempotency keys** no endpoint de checkout — evita cobrança duplicada em retry de rede.

## Status de implementação

**Nada da infraestrutura de escala acima existe ainda** (sala de espera, ECS, Aurora, Redis, filas, CloudFront/WAF) — é desenho pra quando o tráfego justificar. Isso é sobre *throughput* em pico (milhares de requisições por segundo).

O que **já está implementado e é uma preocupação diferente — corretude sob concorrência** (não throughput): nenhuma capacidade limitada do sistema (vaga de lote, uso de cupom) é checada e reservada em passos separados (ler → decidir → escrever), porque isso tem uma corrida de verdade — duas requisições concorrentes podem ler o mesmo estado "ainda cabe" antes de qualquer uma escrever, e as duas passam, estourando o limite. Todo lugar que precisa disso usa uma única instrução SQL condicional (`UPDATE ... WHERE <ainda cabe>`, checando linhas afetadas) em vez de ler-decidir-escrever:

- **Capacidade de lote na emissão** (`LoteRepository.ocuparVagaEmitidaSeDisponivel`) — `apps/api/src/events/repository/prisma-lote.repository.ts`.
- **Limite de usos de cupom** (`CupomDescontoRepository.incrementarUsosSeDisponivel`) — mesmo arquivo do cupom.
- **Check-in** (`IngressoRepository.marcarComoUsadoSeValido`) — já usava esse padrão desde a fatia de check-in original.
- **Transferência e cancelamento self-service** (`transferirSePertence`, `cancelarSePertence`) — a condição de posse (`compradorEmail = ?`) no próprio WHERE já é uma trava correta contra duas ações concorrentes na mesma linha.
- **Reserva de ingresso (hold de 15 minutos)** — mesmo padrão, ver seção "Reserva de ingresso" em [11-roadmap.md](11-roadmap.md).

Sem essas travas, duas pessoas comprando o "último ingresso" ao mesmo tempo (ou dois usos simultâneos do último uso de um cupom) resultariam em overselling — exatamente o cenário que "diversas pessoas fazendo a mesma ação ao mesmo tempo" descreve. Isso é testável sem precisar simular 25k usuários: qualquer teste com 2+ requisições `POST` concorrentes pro mesmo lote quase esgotado já exercita a trava.
