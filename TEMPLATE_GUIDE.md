# Guia de Personalização (Modelo White-Label)

Este projeto está estruturado para ser clonado e adaptado rapidamente para qualquer outro estabelecimento de alimentação (hamburgueria, pizzaria, açaí, marmitaria, hot dog, etc.).

## Passo a passo para personalizar um novo estabelecimento

### 1. Identidade, WhatsApp, Bairros e Textos (`src/config/store.ts`)
Edite este arquivo para configurar praticamente toda a operação da nova loja:
- `STORE_INFO`: nome da loja, bairro, cidade, pedido mínimo (`minOrder`), taxa padrão (`deliveryFee`), tempo de entrega (`deliveryTimeMin`), número do WhatsApp (`whatsappNumber` no formato `5511999999999`), prefixo dos pedidos (`orderCodePrefix`), textos da busca, destaque e imagem de capa (`bannerImg`).
- `NEIGHBORHOOD_FEES`: lista de bairros/regiões atendidos com seus valores de frete e a opção de retirada no balcão.
- `ABOUT_SECTION`: título, descrição e os 3 blocos institucionais da aba "A Lanchonete".
- `KITCHEN_STAGES`: etapas exibidas no acompanhamento de pedido.

### 2. Paleta de Cores (`src/index.css`)
Altere apenas os tokens do bloco `@theme` para aplicar a identidade visual do novo cliente em toda a interface:
- `--color-brand`: cor principal dos botões e destaques.
- `--color-brand-hover`: cor de hover dos botões principais.
- `--color-brand-soft` e `--color-brand-deep`: cor de seleção de texto.
- `--color-surface`: cor de fundo geral da página.

### 3. Imagens e Cardápio (`src/assets/images/` e `src/data/menu.ts`)
- Substitua os arquivos de imagem em `src/assets/images/` pelas fotos do novo estabelecimento (preferencialmente `.jpg`, `.png` ou `.webp`).
- Em `src/types.ts` (tipo `MenuCategory`) e `src/data/menu.ts`:
  - Ajuste `MENU_CATEGORIES` com as novas categorias.
  - Ajuste `CUSTOMIZATION_GROUP_MAP` com os adicionais, tamanhos, sabores ou molhos desejados.
  - Atualize `RAW_ITEMS` com os produtos, preços, promoções (`originalPrice`) e imagens importadas.

### 4. Metadados e Firebase
- `index.html`: atualize `<title>`, `<meta name="description">`, `og:title` e `og:description`.
- `metadata.json`: atualize nome e descrição do novo app.
- Configure o projeto Firebase do estabelecimento via variáveis de ambiente (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_DATABASE_ID`) conforme `.env.example`, sem versionar chaves no repositório.
- Modelo **uma loja por implantação**: cada deploy aponta para o seu próprio projeto/banco Firestore.
- Após alterações de regras, publique `firestore.rules` no projeto Firebase correspondente (`firebase deploy --only firestore:rules`).

### 5. Painel Administrativo (`/admin`) e Deploy na Vercel
- O projeto segue arquitetura monorepo (`server/` com Express + `src/client/` com React/Vite).
- **Mesmo domínio (padrão)**: acesse `/` para o cardápio público e `/admin` para o painel administrativo (`vercel.json` já faz o roteamento).
- **Domínio separado para o painel**: crie um segundo projeto na Vercel apontando para o mesmo repositório e defina `VITE_APP_MODE=admin` nas Environment Variables (ou configure `VITE_ADMIN_HOST`).
- O e-mail principal administrador fica configurado em `src/shared/firebase.ts` (`BOOTSTRAP_ADMIN_EMAIL`) e em `firestore.rules`.

### 6. Persistência e Acompanhamento Real de Pedidos (Zero PII)
- **Checkout (`src/components/CheckoutScreen.tsx` + `src/shared/orderRepository.ts`)**:
  - Ao finalizar o checkout, são gerados um `orderId` imprevisível (`UUID v4`) e um `trackingToken` aleatório de 192 bits no navegador.
  - Em um lote atômico (`writeBatch`), o sistema grava `/orders/{orderId}` (com itens em `/orders/{orderId}/items`) e `/order_trackers/{trackerId}` (com itens em `/order_trackers/{trackerId}/items`), onde `trackerId = SHA-256(orderId + ":" + trackingToken)`.
  - **Zero PII no Firestore**: nome, WhatsApp, endereço, bairro e observações livres do cliente (`observacao`) nunca são gravados no Firestore — permanecem apenas no `localStorage` do cliente (`src/shared/orderStorage.ts`) e na mensagem enviada ao WhatsApp.
  - **Estados de erro e indisponibilidade**: se o Firebase não estiver configurado ou a gravação falhar, o pedido continua sendo enviado ao WhatsApp, mas a interface não exibe acompanhamento em tempo real falso e permite tentar registrar novamente.
- **Restauração e Sincronização (`src/client/storefront/StorefrontApp.tsx` + `src/components/OrdersScreen.tsx`)**:
  - Ao recarregar a página, o cliente restaura do `localStorage` seus dados de entrega e os IDs/tokens dos pedidos persistidos, reconectando automaticamente via `onSnapshot` em `/order_trackers/{trackerId}`.
  - Clientes públicos não conseguem listar `/orders` nem avançar etapas da cozinha.
- **Operação da Cozinha no Painel (`src/client/admin/views/OrdersAdminView.tsx`)**:
  - Somente equipe autenticada e ativa (`isActiveStaff()`) acessa a aba **Pedidos** no painel `/admin`, visualiza pedidos em tempo real e avança as etapas (`Confirmado` → `Na Chapa` → `Montagem` → `Pronto`), atualizando `/orders` e `/order_trackers` atomicamente.

### 7. Scripts de Desenvolvimento, Qualidade e Build
- `npm run dev`: inicia servidor Express + Vite em `http://localhost:3000`.
- `npm run typecheck`: valida tipagem TypeScript (`tsc --noEmit`).
- `npm run lint`: executa ESLint no código da aplicação (`src/`, `server/`, `api/`, `tests/`, `scripts/`).
- `npm run lint:rules`: valida sintaxe e segurança de `firestore.rules`.
- `npm test`: executa a suíte automatizada de pedidos, restauração, zero-PII e invariantes de segurança.
- `npm run build`: build público padrão.
- `npm run build:admin`: build administrativo multiplataforma (via `scripts/build-admin.mjs`, compatível com Windows e POSIX).
