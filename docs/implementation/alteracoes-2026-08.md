[← Voltar à documentação](../README.md)

# Alterações — agosto de 2026

## Ambiente e dependências

- Instalado `pnpm@11.20.0` no perfil do usuário do Windows.
- Gerado `pnpm-lock.yaml` para tornar as instalações reproduzíveis.
- Autorizados em `pnpm-workspace.yaml` os scripts nativos exigidos pelas dependências do projeto.
- Adicionado `lucide-react` ao frontend para padronizar a iconografia.

## PostgreSQL e Prisma

- Alterada a porta publicada do PostgreSQL Docker de `5432` para `5433` para evitar conflito com um PostgreSQL instalado no Windows.
- Atualizada `DATABASE_URL` em `.env.example` e no ambiente local da API.
- Criada e aplicada a migration inicial `20260807113915_init`.
- Prisma Client gerado com sucesso.
- Banco validado com `prisma migrate status`.

## Refatoração do frontend

- Marca visual atualizada para Novyx.
- Temas claro e escuro reconstruídos com tokens semânticos.
- Nova home pública inspirada no wireframe do produto.
- Header e footer responsivos adicionados.
- Login e cadastro migrados para uma composição visual compartilhada.
- Lista, criação e detalhes de eventos modernizados.
- Telas de financeiro, conta de repasse, equipe e status alinhadas ao novo design system.
- Componentes `Button`, `Card`, `Input`, `Select`, `Stat`, `ThemeToggle` e `ProtectedPage` atualizados.
- Adicionados gradientes, cards translúcidos, sombras, estados vazios, carregamentos e microinterações.
- Metadados da aplicação atualizados para Novyx.

## Verificação

- Build de produção do frontend concluído com sucesso.
- Todas as rotas Next.js compiladas e tiveram os tipos validados.
- Portas `3000` e `3001` liberadas após encerramento das árvores antigas do backend e frontend.
