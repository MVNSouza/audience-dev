# Audience — Contexto para outras IAs

## Produto
Audience é uma aplicação web para avaliação coletiva de apresentações acadêmicas. Professor cria uma sessão, compartilha um QR Code e estudantes respondem anonimamente pelo celular. Resultados são agregados para o professor.

### Público
Professores, estudantes e instituições de ensino.

### Objetivos
- substituir formulários físicos;
- permitir avaliações rápidas e anônimas;
- suportar diferentes escalas;
- reduzir votos duplicados;
- mostrar resultados consolidados;
- manter sessões temporárias.

## Regras
- Não existe login obrigatório no MVP.
- Aluno não fornece nome, e-mail ou conta.
- Professor recebe um `adminToken` secreto ao criar uma sessão.
- Sessão possui código público curto.
- Sessão expira em 7 dias.
- O controle de duplicidade usa UUID aleatório do navegador com hash SHA-256 no servidor.
- Nunca afirmar que esse mecanismo identifica permanentemente um aparelho.

## Escalas
- `stars`: 1–5 estrelas
- `number`: 0–10
- `tomatoes`: 1–5 tomates
- `gamified`: 1–5 emojis

A API também suporta pergunta `text`.

## Frontend
- `/` — home
- `/create` — criação de sessão
- `/vote/:code` — votação pública
- `/manage/:code?token=...` — painel do professor

## API
- `GET /api/health`
- `POST /api/sessions`
- `GET /api/sessions/:code`
- `POST /api/sessions/:code/evaluations`
- `POST /api/sessions/:code/close`
- `GET /api/sessions/:code/results?adminToken=...`

## Banco
### `sessions`
`id`, `title`, `description`, `access_code`, `admin_token`, `status`, `expires_at`, `created_at`

### `questions`
`id`, `session_id`, `title`, `type`, `scale_type`, `min`, `max`, `required`, `description`

### `evaluations`
`id`, `session_id`, `voter_hash`, `created_at`, com unicidade em `(session_id, voter_hash)`

### `answers`
`id`, `evaluation_id`, `question_id`, `numeric_value`, `text_value`

## Arquitetura
Monorepo npm workspaces:
- `client/` React/Vite/TypeScript
- `server/` Express/JavaScript
- `docs/` documentação

Responsabilidades:
- regra de negócio: `server/src/services`
- rotas: `server/src/routes`
- banco: `server/src/db`
- páginas: `client/src/pages`
- componentes: `client/src/components`
- API client: `client/src/lib/api.ts`

## Decisões
React e Express são obrigatórios para a arquitetura atual. SQLite foi escolhido para reduzir complexidade do MVP. O cliente usa `fetch`, sem Axios. TypeScript fica apenas no frontend.

## Identidade visual
Tema escuro, minimalista, pensado para celular e projetor. Gradiente principal `#FF7300` → `#C71787`.

## Já implementado
Criação, QR Code, votação anônima, prevenção básica de duplicidade, resultados, fechamento, expiração em 7 dias, cleanup e documentação de contexto para IA.

## Ainda não implementado
Login, PostgreSQL, tempo real, exportação CSV/PDF, modelos salvos, dashboard institucional, PWA e autenticação robusta do professor.

## Regras para evoluir
Não adicionar login sem solicitação explícita. Não migrar para Next.js. Não remover a anonimização. Ao adicionar uma escala, atualizar API, editor, componente de votação, resultados e documentação. Ao alterar o banco, preservar compatibilidade e documentar migração.

## Segurança para produção
Adicionar rate limiting, HTTPS, security headers, validação/rules mais rígidas, proteção contra automação, política de retenção, logs sem dados pessoais e autenticação robusta do professor antes de uso institucional.
