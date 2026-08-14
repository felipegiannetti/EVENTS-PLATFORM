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
- **Ainda não implementado**: Secrets Manager (segredos hoje vivem em `.env` local).
- **Conexão com o banco**: `DATABASE_URL` local (docker-compose) não usa TLS de propósito — Postgres local não expõe. Fora do ambiente local, a `DATABASE_URL` real (staging/produção) **precisa** incluir `?sslmode=require` (ou equivalente do provedor gerenciado) — ver comentário em `.env.example`.

## Rodada de hardening (baseada em checklist de 43 requisitos de segurança)

Feita a partir de um checklist externo de requisitos não-funcionais de segurança (OWASP/LGPD/Marco Civil), comparando requisito por requisito contra o código real. **MFA foi excluído de propósito** (fora de escopo, decisão do usuário) e **itens só-institucionais** (perfis multi-filial, SSO corporativo, atribuição automática por cargo/centro-de-custo) foram marcados não-aplicável — a plataforma é B2C, não corporativa multi-tenant.

- **Rate limiting expandido**: `POST /events/public/:id/cupom/:codigo/desbloquear` (força-bruta de senha de cupom especial, 10/min), `GET .../cupom/:codigo` (30/min), as 4 rotas de `ReservasPublicasController` (20-30/min) e `/auth/google` + `/auth/google/callback` (20/min) — antes dependiam só do default global (100/min). Ver `apps/api/src/events/events.controller.ts`, `apps/api/src/tickets/reservas-publicas.controller.ts`.
- **Bloqueio de conta após login falho**: `Usuario.tentativasFalhas`/`bloqueadoAte` (schema) — 5 tentativas seguidas bloqueiam o login por 15 minutos; reseta em login bem-sucedido. Ver `AuthService.validarCredenciais`.
- **Exclusão de conta (LGPD)**: `AuthService.deletarConta` agora anonimiza `Ingresso.compradorNome/compradorEmail/compradorDocumento` dos ingressos do usuário excluído (antes sobreviviam intactos, já que não há FK — a ligação é só por email). `AcordoComercial` vinculado (organizador ou admin que definiu) continua bloqueando a exclusão com erro de domínio amigável (era `Restrict` cru antes). `AuditLog.usuario` virou `onDelete: SetNull` (era `Restrict`) — histórico de auditoria sobrevive à exclusão da conta do autor, sem travar nada.
- **Criptografia de documentos pessoais**: `Usuario.documento` e `Ingresso.compradorDocumento` (CPF/CNPJ) agora usam o mesmo padrão AES-256-GCM já usado pra conta bancária (`campo-criptografado.util.ts`), com chave própria (`DOCUMENTO_ENCRYPTION_KEY`, separada de `CONTA_BANCARIA_ENCRYPTION_KEY`). Como `Usuario.documento` precisa continuar único/buscável, ganhou um índice determinístico paralelo (`Usuario.documentoHash`, HMAC-SHA256) — o `@unique` saiu do campo criptografado (não é comparável, IV é aleatório) e foi pro hash.
- **Upload de banner**: `EventsService.atualizarBanner` não confia mais só no `Content-Type` que o navegador manda — verifica os magic bytes reais do arquivo (`apps/api/src/infra/arquivo/detectar-mime-real.util.ts`, JPEG/PNG/WEBP) antes de aceitar.
- **Auditoria expandida**: `AuditLog` agora também grava `LOGIN`, `LOGIN_FALHO`, `ALTERAR_SENHA` e `EXCLUIR_CONTA` (antes só cobria acordo comercial e feature flag). Nova tela `GET /admin/auditoria` + `/admin/auditoria` no painel do admin — antes só existia o `INSERT`, nunca o `SELECT`.
- **Senha com exigência de complexidade**: `registerSchema.senha`/`alterarSenhaSchema.novaSenha` (`packages/shared-types`) agora exigem maiúscula+minúscula+número (além do `min(8)` que já existia) e recusam uma lista curta de senhas óbvias (`validators/senha.ts`).
- **Headers de segurança completos**: `helmet` adicionado em `apps/api/src/main.ts` — CSP (`default-src 'none'`, API só serve JSON/imagens/PDF), HSTS e Permissions-Policy, além dos 3 headers manuais que já existiam.
- **Documentação de API**: Swagger/OpenAPI (`@nestjs/swagger`) em `/docs`, só fora de produção (`NODE_ENV !== "production"`).
- **Fora de escopo desta rodada** (registrado como pendência, ver [13-pendencias.md](13-pendencias.md)): diferenciar TTL de sessão por papel/timeout de inatividade; logging estruturado com userId/IP persistido (hoje é só `método + rota + ms` via `LoggingInterceptor`, console-only).
