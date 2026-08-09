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
- **Ainda não implementado**: Secrets Manager (segredos hoje vivem em `.env` local), rate limit na busca por CPF (não existe busca por CPF — `ListaOff` não tem endpoint algum, ver [03-modulos-backend.md](03-modulos-backend.md)), e log de auditoria (`AuditLog` existe só no schema, nenhum código grava nele).
