[← Voltar ao índice](README.md)

# Módulos do backend (NestJS)

| Módulo | Responsabilidade | Observação de escala/segurança |
|---|---|---|
| `auth` | Login, JWT + refresh token, RBAC por papel **e por evento** (owner/gestor/view/checkin_operator/admin_geral) | Guards do Nest checam papel por evento, não só global |
| `events` | CRUD de evento, lotes, links de venda, papéis de acesso | — |
| `tickets` | Emissão, status, QR, trava de transferência (configurável por evento) | Constraint única no banco para evitar duplicidade |
| `checkout` (compra/pagamento) | Fluxo de compra, integração com gateway (adapter plugável), fila assíncrona | Webhook responde rápido, emissão do ingresso roda em worker via SQS/BullMQ; idempotency key no checkout |
| `checkin` | Validação de QR em tempo real (sempre online, sem fallback offline — ver [07-app-checkin.md](07-app-checkin.md)), idempotência | Transação com lock otimista: 2ª leitura do mesmo QR falha visivelmente |
| `guestlist` (lista off) | CPFs cadastrados por evento, status de uso | Rate limit na busca por CPF (evita varredura) |
| `reports` | Parciais em CSV, envio agendado por e-mail segmentado por link | Job agendado via BullMQ + SES |
| `admin` | Painel superadmin NOVYX: feature flags globais, visão de todos os eventos, configuração de `AcordoComercial` (split de taxa por organizador) | Rota isolada, só acessível por `admin_geral` |
| `notifications` | E-mail (SES) e futuramente push (SNS) para o app | — |
| `audit-log` | Trilha de auditoria (quem, quando, onde, dispositivo) | Obrigatório para check-in e edições de evento |
