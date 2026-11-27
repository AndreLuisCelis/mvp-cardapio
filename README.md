<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/070f84c3-5316-4f55-880a-3e36752f984a

## Executar Localmente

**Pré-requisitos:** Node.js 20+

1. Instale as dependências:
   `npm install`
2. Copie `.env.example` para `.env.local` e preencha as variáveis públicas `VITE_FIREBASE_*` (nunca versione chaves reais).
3. Inicie o servidor de desenvolvimento (cardápio em `/` e painel em `/admin`):
   `npm run dev`

## Validação e Build

- `npm run typecheck` — verificação de tipos TypeScript
- `npm run lint` — lint do código da aplicação
- `npm run lint:rules` — lint das regras Firestore (`firestore.rules`)
- `npm test` — testes automatizados de pedidos, restauração, zero-PII e segurança
- `npm run build` — build público
- `npm run build:admin` — build administrativo (compatível com Windows e POSIX)

Consulte `TEMPLATE_GUIDE.md` e `security_spec.md` para detalhes de operação, personalização e arquitetura de segurança.

