[← Voltar ao índice](README.md)

# Modelo de dados (entidades principais)

Baseado no resumo do produto, com adições para RBAC por evento, split financeiro e auditoria:

- **Usuario** (id, nome, email, senha_hash, papel_global, **tipo_pessoa**: fisica/juridica, **documento** (CPF ou CNPJ, único, validado por dígito verificador real — nunca só por tamanho), **data_nascimento** (obrigatória só pra pessoa física; empresa não tem)) — pessoa jurídica usa o campo `nome` como razão social (não existe coluna separada; ver [docs/implementation/README.md](../implementation/README.md)). **Pendência adiada a pedido do usuário**: confirmar que o CPF/CNPJ existe de verdade (não só o dígito verificador) exigiria consulta a um serviço externo pago — mesma categoria de pendência da conta bancária (ver [09-modelo-financeiro.md](09-modelo-financeiro.md))
- **PapelAcesso** (usuario_id, evento_id, papel: owner/gestor/view/checkin_operator) — RBAC por evento
- **Evento** (id, nome, data, **data_fim** opcional, cidade, estado, pais, local legado, categoria: shows/festivais/negocios/esportes/cursos/tecnologia/outros, transferivel: bool, **imagem_banner**: bytes (bytea) + **imagem_banner_tipo**: mime type, **publicado**: bool, padrão `false` — controla se o evento aparece em `GET /events/public`; o organizador enxerga o próprio evento independente disso, **descricao**, **contato_nome**, **contato_email**, **contato_telefone**, todos opcionais)
- **ContaBancaria** (id, evento_id **único** — por evento, não por organizador, banco: código Febraban de lista curada, agencia, conta, tipo_conta: corrente/poupanca, titular, documento_titular) — ver [09-modelo-financeiro.md](09-modelo-financeiro.md)
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
- Unique `Usuario.documento` — evita duas contas com o mesmo CPF/CNPJ
- QR token assinado (HMAC-SHA256) no back-end — nunca confiar em payload decodificado só no app

## Imagens salvas como bytes, não em storage externo

Decisão de produto: banner do evento (e qualquer outra imagem do sistema) fica salvo como **bytes direto no Postgres** (`bytea`), não em S3/storage externo com URL. Implicações que valem documentar pra quem for mexer nisso depois:

- **Nunca** fazer `SELECT *`/incluir a coluna de bytes em listagens — só a rota dedicada de servir a imagem (`GET /events/:id/banner`) toca nesses bytes; toda outra consulta seleciona só os campos leves (inclusive um booleano `temBanner` calculado a partir do campo de mime-type, sem carregar o blob).
- Upload por `multipart/form-data` (não JSON) com limite de tamanho (5MB) e lista de mime-types aceitos (`image/jpeg`, `image/png`, `image/webp`), validados tanto pelo Multer (corta o upload antes de bufferizar tudo) quanto pela regra de negócio no Service.
- **Trade-off aceito conscientemente**: bytes no Postgres tornam o banco maior e mais lento de fazer backup/restore conforme a base de imagens cresce, comparado a um storage de objetos dedicado (S3, R2, etc.). É uma decisão válida pra este estágio do produto — se o volume de imagens crescer muito, migrar pra storage externo é um passo natural (a interface `EventoRepository.buscarBanner`/`atualizarBanner` já isola essa lógica num único lugar pra facilitar a troca depois).
