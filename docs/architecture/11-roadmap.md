[← Voltar ao índice](README.md)

# Roadmap e fora de escopo

Nenhum código foi escrito nesta fase — estes documentos são só a arquitetura. Próximos passos sugeridos (a discutir separadamente): ordem de implementação dos módulos, setup inicial do monorepo, e definição do MVP (quais módulos entram na primeira versão vendável).

## Roadmap futuro (pós web + app completos)

Sistema de ponto de venda para o **bar do evento** (comandas, controle de consumo, fechamento de caixa) — módulo novo, avaliado depois que a plataforma de ingressos e o app estiverem consolidados. A arquitetura de monólito modular já comporta esse tipo de adição futura como um novo módulo (ex: `bar-pos`), reaproveitando auth, RBAC por evento e o mesmo app mobile.
