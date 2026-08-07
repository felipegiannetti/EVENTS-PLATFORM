[← Voltar ao índice](README.md)

# Modelo de dados (entidades principais)

Baseado no resumo do produto, com adições para RBAC por evento, split financeiro e auditoria:

- **Usuario** (id, nome, email, senha_hash, papel_global)
- **PapelAcesso** (usuario_id, evento_id, papel: owner/gestor/view/checkin_operator) — RBAC por evento
- **Evento** (id, nome, data, local, transferivel: bool)
- **Lote** (id, evento_id, nome, preço, quantidade)
- **LinkVenda** (id, evento_id, slug, origem)
- **Ingresso** (id, evento_id, lote_id, link_venda_id, status: válido/usado/cancelado, qr_token, transferivel)
- **Transacao** (id, ingresso_id, gateway, status, valor, metodo: pix/cartão)
- **ListaOff** (id, evento_id, cpf, status_uso, usado_em)
- **FeatureFlag** (chave, ativo, escopo: global ou lista de eventos)
- **AuditLog** (id, usuario_id, ação, entidade, entidade_id, dispositivo, ip, timestamp)
- **Usuario.asaas_subconta_id** — vincula o organizador à subconta no gateway para split/repasse (ver [09-modelo-financeiro.md](09-modelo-financeiro.md))
- **Evento.taxa_paga_por** (comprador | organizador) — quem absorve os 12% de taxa de serviço (ver [09-modelo-financeiro.md](09-modelo-financeiro.md))
- **AcordoComercial** (id, organizador_id, evento_id opcional, percentual_novyx, percentual_organizador, escopo: todos_eventos/evento_especifico/proximos_n_eventos, eventos_restantes opcional, ativo, definido_por_admin_id, criado_em) — como os 12% de taxa se dividem entre NOVYX e organizador, configurado pelo admin geral e aplicado direto no split do checkout (ver [09-modelo-financeiro.md](09-modelo-financeiro.md))

## Constraints críticas no nível do banco (não só na aplicação)

- Unique + lock otimista em `Ingresso.status` para impedir check-in duplicado em corrida (race condition)
- Unique `(evento_id, cpf)` em `ListaOff`
- QR token assinado (HMAC-SHA256) no back-end — nunca confiar em payload decodificado só no app
