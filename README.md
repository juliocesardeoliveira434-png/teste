<div align="center">

# 🛍️ Vitrine

### Plataforma de e-commerce completa — loja, checkout e painel administrativo

**Responsiva de verdade (PC, tablet e celular) · Zero dependências · Zero build · Funciona offline**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![PWA](https://img.shields.io/badge/PWA-instalável-5A0FC8?logo=pwa&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)

**53 produtos · 10 categorias · 168 pedidos de demonstração · 3 meios de pagamento · 7 telas de administração**

</div>

---

## ▶ Como abrir agora

**Jeito 1 — duplo clique:** abra o `index.html` no navegador. Pronto, sem instalar nada.

**Jeito 2 — servidor local (recomendado):**

```bash
cd vitrine
python3 -m http.server 8080
# abra http://localhost:8080
```

**Jeito 3 — GitHub Pages (hospedagem grátis):**

1. Deixe o repositório **público** (no plano gratuito o Pages não publica repos privados);
2. **Settings → Pages → Build and deployment**;
3. Em *Source*, escolha o branch e a pasta `/ (root)`;
4. Em ~1 minuto a loja está no ar em `https://SEU-USUARIO.github.io/SEU-REPO/`.

> Não precisa de chave de API, de conta em serviço externo nem de banco de dados.
> Nenhum dado sai do navegador — tudo roda em `localStorage`.

---

## ✨ O que vem pronto

### 🏬 Loja (cliente)

| Tela | O que entrega |
|---|---|
| **Home** | Hero animado, faixa de benefícios, 10 categorias, destaques, ofertas, banner promocional com contador regressivo, mais vendidos, marcas em carrossel, prova social e newsletter |
| **Catálogo** | Filtros facetados (categoria, marca, faixa de preço com slider duplo, avaliação, promoções, estoque), 7 ordenações, chips de filtros ativos, visão grade/lista, paginação — tudo em gaveta deslizante no celular |
| **Produto** | Galeria com zoom, variantes de cor e tamanho, calculadora de frete por CEP, abas (descrição / ficha técnica / avaliações / frete), distribuição de notas, avaliações verificadas e produtos relacionados |
| **Carrinho** | Gaveta lateral + página completa, quantidade, cupons, estimativa de frete, barra de "falta X para o frete grátis" e cross-sell |
| **Checkout** | 4 etapas com validação: dados → endereço (auto-preenchido pelo CEP) → pagamento → revisão. Resumo sempre visível |
| **Pagamento** | **Pix** com QR Code e BR Code real (EMV® com CRC16) · **Cartão** com detecção de bandeira, validação Luhn e até 12x · **Boleto** com linha digitável e DV módulo 10/11 |
| **Pedido** | Confirmação com código, instruções de pagamento, timeline de status e rastreio |
| **Minha conta** | Login/cadastro, painel com visão geral, pedidos (detalhe, rastreio, avaliar, recomprar), favoritos, endereços e dados pessoais |
| **Planos** | 3 planos, toggle mensal/anual (−20%), comparativo completo, FAQ e contratação com cartão |
| **Institucional** | Sobre, contato com formulário, FAQ, frete/devoluções, termos de uso e privacidade (LGPD) |

### 🎛️ Painel administrativo (`#/admin`)

| Seção | O que faz |
|---|---|
| **Dashboard** | 4 KPIs com variação %, gráfico de receita (7/30/90 dias) com tooltip, donut de meios de pagamento, funil de conversão, ranking de produtos, últimos pedidos e alertas de estoque |
| **Pedidos** | Filtro por status e pagamento, busca, ordenação, paginação, detalhe completo, **mudança de status** e exportação CSV |
| **Produtos** | Tabela com miniatura, busca, filtro, ordenação, seleção múltipla (ativar / zerar estoque / excluir), editor em 4 abas (geral, preço & estoque, mídia, especificações), duplicar, criar, excluir e exportar CSV |
| **Clientes** | Base completa com LTV, ticket médio, barra de valor, perfil detalhado com histórico e exportação |
| **Cupons** | CRUD de cupons (percentual, valor fixo, frete grátis) com valor mínimo e uso |
| **Relatórios** | Receita por categoria (barras), meios de pagamento, funil, produtos campeões, melhores clientes e exportação |
| **Configurações** | Dados da loja, meios de pagamento, desconto do Pix, parcelamento e juros, frete grátis, impostos, alerta de estoque, **cor da marca ao vivo**, tema claro/escuro, backup JSON e restauração |

---

## 🎨 Design

Sistema de design próprio com **tokens CSS** — não é template de terceiro:

- **Marca configurável**: troque a cor primária no painel (ou no `settings`) e tudo acompanha — botões, gráficos, gradientes, ícones, QR do Pix.
- **Tema claro e escuro** completos, com persistência.
- **53 ícones SVG** desenhados no projeto (sem Font Awesome, sem requisição).
- **"Fotografia" dos produtos gerada em SVG** a partir da categoria + matiz: zero imagens, zero peso, nítido em qualquer tela.
- **Gráficos em Canvas 2D** feitos à mão (linha/área, barras, donut, funil, sparkline) — sem Chart.js.
- Tipografia, espaçamento, raios e sombras padronizados em escalas.

### Responsividade testada em 5 breakpoints

| Largura | Comportamento |
|---|---|
| ≥ 1200px | Três colunas, sidebar de filtros fixa, navegação por categorias no topo |
| 992–1199px | Grade compacta, resumo lateral estreito |
| 768–991px | Filtros em gaveta, produto em coluna única, tabelas com rolagem horizontal |
| 576–767px | 2 colunas de produto, **barra de navegação inferior**, checkout em passos |
| < 576px | Grade otimizada, botões full-width, modais em sheet |

Inclui `prefers-reduced-motion`, foco visível, `aria-*`, navegação por teclado, trap de foco em modais e link de "pular para o conteúdo".

---

## 🧩 Arquitetura

```
index.html                 shell + ordem de carregamento
manifest.webmanifest       PWA instalável
sw.js                      service worker (offline, stale-while-revalidate)

css/
  tokens.css               variáveis de design + tema escuro
  base.css                 reset, tipografia, utilitários, splash
  components.css           botões, inputs, cards, modal, toast, tabelas…
  layout.css               header, footer, tabbar, gaveta, palette
  store.css                loja: hero, catálogo, produto, checkout, planos
  admin.css                painel: sidebar, KPIs, tabelas, editor
  responsive.css           5 breakpoints + impressão

js/
  lib/dom.js               micro-helper de DOM (sem jQuery)
  lib/format.js            moeda, datas, CPF/CNPJ, Luhn, parcelamento (pt-BR)
  lib/rng.js               gerador determinístico (mulberry32)
  ui/icons.js              53 ícones SVG inline
  ui/art.js                geração procedural das imagens de produto
  ui/charts.js             gráficos em Canvas 2D
  ui/components.js         componentes renderizáveis
  ui/toast.js  modal.js    notificações e diálogos
  data/catalog.js          categorias e catálogo (53 produtos)
  data/seed.js             pedidos, clientes, cupons e séries
  state/store.js           estado global + localStorage + pub/sub
  state/cart.js            carrinho, cupons, frete e totais
  services/payments.js     Pix (BR Code), boleto, cartão, criação de pedido
  services/shipping.js     regiões por CEP e cotação
  services/cep.js          consulta de CEP (mock determinístico)
  pages/*.js               10 páginas (render + mount)
  app.js                   router, shell, gaveta, palette, boot

legacy/teclaton/           projeto anterior deste repositório (preservado)
```

Padrão: cada página é um módulo `{ title, render(params), mount(root, params) }`.
O router é por hash (`#/produto/slug`), o container `#view` é recriado a cada
navegação — sem vazamento de listeners, sem framework.

---

## 🔌 Como plugar um backend real

Todos os pontos de integração estão isolados e sinalizados com comentários:

| O que trocar | Onde |
|---|---|
| Catálogo de produtos | `js/data/catalog.js` → `VT.catalog.query()` (hoje filtra em memória) |
| Pedidos e clientes | `js/data/seed.js` → substituir por `fetch('/api/orders')` |
| **Autorização de pagamento** | `js/services/payments.js` → `VT.payments.process()` (hoje simula 1s de latência) |
| Consulta de CEP | `js/services/cep.js` → `lookup()` (troque por ViaCEP) |
| Cotação de frete | `js/services/shipping.js` → `quote()` (Correios, Melhor Envio, Loggi) |
| Login | `js/pages/account.js` → `S.login()` |
| Persistência | `js/state/store.js` → hoje `localStorage` |

Exemplo de substituição do pagamento:

```js
// js/services/payments.js — process()
fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ order, card: data })
}).then(r => r.json())
  .then(res => resolve({ ok: res.approved, txid: res.gatewayId, message: res.message }));
```

---

## 🧪 Dados de demonstração

| Item | Valor |
|---|---|
| Login | `demo@vitrine.com` / `123456` (ou qualquer e-mail válido + senha de 6+ caracteres) |
| Cartão aprovado | `4111 1111 1111 1111` |
| Cartão recusado | qualquer `4...0000` |
| Cartão sem limite | qualquer `4...9999` |
| Cupons | `BEMVINDO10` · `VITRINE15` · `FRETEZERO` · `PRIMEIRA50` |
| CEPs válidos | qualquer 8 dígitos — ex.: `38400-100` (Uberlândia/MG) |

> O painel já vem com 168 pedidos, 49 clientes e 5 cupons gerados de forma
> determinística — os números não mudam entre recarregamentos.

---

## ✅ Qualidade

- Validação de **CPF e CNPJ** com dígito verificador real
- **Luhn** para número de cartão + detecção de bandeira (Visa, Master, Amex, Elo, Hipercard…)
- **BR Code do Pix** com CRC16-CCITT calculado de verdade
- **Boleto** com linha digitável de 47 dígitos e campos com DV módulo 10/11
- Parcelamento com juros compostos (tabela Price) e faixa sem juros configurável
- Frete por região a partir do CEP, com frete grátis progressivo
- Sanitização de HTML (`esc()`) em todo conteúdo renderizado
- Tratamento de erro por rota: uma página com problema não derruba a loja

---

## 🗺️ Próximos passos sugeridos para vender

1. **Checkout transparente real** — troque `payments.process()` pelo gateway do cliente.
2. **Multiloja** — o `store.js` já isola o estado; basta trocar a chave do `localStorage` por tenant.
3. **Importação de produtos** — o editor já aceita CSV; falta o upload.
4. **Notificações por e-mail** — templates prontos em `createOrder()`.
5. **White-label completo** — a cor e o nome já saem do painel; exponha também logo e domínio.

---

<div align="center">

Feito com ❤️ e JavaScript puro. Sem framework, sem build, sem dependência —
só abrir e vender.

</div>
