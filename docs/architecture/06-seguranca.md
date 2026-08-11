[← Voltar ao índice](README.md)

# Segurança e conformidade

- Segredos em **AWS Secrets Manager**; TLS/HSTS em todas as camadas.
- QR assinado com HMAC-SHA256 (ticket id + nonce); validação sempre no back-end, com transação atômica para impedir dupla leitura.
- RBAC por papel **e por evento** via Guards do NestJS.
- Rate limiting em login, checkout e busca de CPF na lista off.
- Nunca armazenar dado de cartão — usar tokenização/checkout transparente do gateway (compatível com PCI-DSS).
- **LGPD**: CPF e dados pessoais (lista off) exigem política de retenção, criptografia em repouso (RDS encryption) e controle de acesso — vale revisar com jurídico antes do lançamento.
- Log de auditoria obrigatório em check-in e edições sensíveis.

## Status de implementação

- **Já implementado**: criptografia reversível (AES-256-GCM, `apps/api/src/infra/crypto/campo-criptografado.util.ts`) para os campos sensíveis de `ContaBancaria` (dados bancários do organizador) — chave só em `CONTA_BANCARIA_ENCRYPTION_KEY` (env, nunca no banco), formato `iv.authTag.ciphertext`. É criptografia de aplicação, não "RDS encryption" (que depende de infraestrutura AWS ainda não provisionada). RBAC por papel e por evento (`RolesGuard`/`EventRoleGuard`), rate limit no login (5/min) e QR assinado HMAC-SHA256 também já valem para o código real, não só para o desenho.
- **Correções de segurança feitas em revisão** (não eram desenho original, foram achadas e corrigidas depois):
  - **IDOR nos endpoints de gestão de ingresso**: `buscar`/`atualizar`/`cancelar`/`reenviarEmail` do `TicketsService` passaram a checar que o ingresso pertence mesmo ao `eventoId` da rota (`buscarDoEvento`) antes de qualquer leitura/edição — sem isso, um gestor de QUALQUER evento (com `EventRoleGuard` válido só pro próprio evento) podia manipular o ingresso de outro organizador só sabendo o UUID, que aliás vai em texto puro dentro do próprio QR code.
  - **CORS**: removida a combinação insegura de origin `*` com `credentials: true` (nunca válida com cookies) — origin agora é restrito à lista configurada.
  - **Rate limit no registro**: `POST /auth/register` também ganhou throttle (não só o login).
  - **XSS em email**: strings controladas pelo organizador (nome do evento, endereço, nome do lote etc.) passaram a ser escapadas (`apps/api/src/infra/mail/escapar-html.util.ts`) antes de entrar no HTML do email de confirmação — sem isso, um nome de evento malicioso quebraria o HTML do email de qualquer comprador.
  - **Headers básicos de segurança** adicionados na API (sem dependência nova).
- **Lista off**: busca e check-in já existem sob autenticação e RBAC por evento, protegidos também pelo limite global de requisições. Um throttle específico mais restritivo para busca de CPF e auditoria detalhada de cada operação continuam como endurecimento futuro.
- **Ainda não implementado**: Secrets Manager (segredos hoje vivem em `.env` local) e auditoria ampla; `AuditLog` hoje registra acordos comerciais, mas ainda não registra todas as edições e check-ins.
