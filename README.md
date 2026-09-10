# Audience

MVP funcional para avaliações anônimas de apresentações acadêmicas.

## Stack

- React + Vite + TypeScript
- Node.js + Express
- SQLite + better-sqlite3
- QR Code com qrcode.react
- Zod para validação

## Funcionalidades

- criação de sessão sem login;
- código público para os alunos;
- QR Code no painel do professor;
- perguntas por estrelas 1–5, nota 0–10, tomates 1–5 e escala gamificada;
- perguntas de texto na API;
- avaliação anônima;
- prevenção de envio duplicado na mesma sessão;
- resultados com média e distribuição;
- encerramento manual;
- expiração automática em 7 dias;
- limpeza de sessões antigas;
- contexto completo para outras IAs em `docs/AI_CONTEXT.md` e `docs/AI_CONTEXT.json`.

## Rodar

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3333`

## Observação sobre anonimato

O MVP gera um UUID aleatório no navegador e envia apenas seu hash para o servidor. Isso ajuda a impedir dois envios no mesmo navegador, mas não é fingerprinting permanente: apagar o armazenamento, trocar de navegador ou dispositivo pode contornar o mecanismo.
