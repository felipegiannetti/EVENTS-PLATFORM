[← Voltar ao índice](README.md)

# Segurança e conformidade

- Segredos em **AWS Secrets Manager**; TLS/HSTS em todas as camadas.
- QR assinado com HMAC-SHA256 (ticket id + nonce); validação sempre no back-end, com transação atômica para impedir dupla leitura.
- RBAC por papel **e por evento** via Guards do NestJS.
- Rate limiting em login, checkout e busca de CPF na lista off.
- Nunca armazenar dado de cartão — usar tokenização/checkout transparente do gateway (compatível com PCI-DSS).
- **LGPD**: CPF e dados pessoais (lista off) exigem política de retenção, criptografia em repouso (RDS encryption) e controle de acesso — vale revisar com jurídico antes do lançamento.
- Log de auditoria obrigatório em check-in e edições sensíveis.
