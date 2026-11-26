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
- Caso utilize Firebase, configure o projeto do novo cliente via variável de ambiente (`VITE_FIREBASE_API_KEY`) sem versionar chaves no repositório.

### 5. Painel Administrativo (`/admin`) e Deploy na Vercel
- O projeto segue arquitetura monorepo (`server/` com Express + `src/client/` com React/Vite).
- **Mesmo domínio (padrão)**: acesse `/` para o cardápio público e `/admin` para o painel administrativo (`vercel.json` já faz o roteamento).
- **Domínio separado para o painel**: crie um segundo projeto na Vercel apontando para o mesmo repositório e defina `VITE_APP_MODE=admin` nas Environment Variables (ou configure `VITE_ADMIN_HOST`).
- O e-mail principal administrador fica configurado em `src/shared/firebase.ts` (`BOOTSTRAP_ADMIN_EMAIL`) e em `firestore.rules`.

