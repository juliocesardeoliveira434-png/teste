# NÃO-LUGAR · Garrafa Nº 01

> Produto de referência apresentado como produto: uma garrafa de vinho modelada em
> tempo real, com medidas reais, giro fluido e cinco planos de câmera.

A base 3D/imersiva virou uma página de venda de verdade: nenhuma foto do produto,
nenhum render exportado — a garrafa é geometria gerada no navegador, do gargalo ao
punt, e você pode girá-la com o dedo.

## O produto

| dado | valor |
| --- | --- |
| vinho | tinto seco de altitude, safra 2023 |
| capacidade | 750 ml |
| altura total | 300 mm |
| diâmetro do corpo | Ø 76 mm |
| diâmetro do gargalo | Ø 24 mm |
| boca | Ø 18,5 mm |
| peso bruto / vidro | 1.180 g / 480 g |
| lote | 001 / 2400, numerado |
| preço | R$ 289,00 (3× R$ 96,33) |

## Como a garrafa é feita

Nada de `.glb` ou `.obj`: o modelo é **construído por perfil**.

- **Perfil real** (`src/bottle.js`) — 24 pontos de `[raio, altura]` em centímetros,
  varridos com `LatheGeometry` por uma spline. Isso produz o punt, o ombro
  bordalês, o gargalo e o lábio com a curvatura correta de uma garrafa soprada.
  Escala 1 unidade = 1 cm, então as cotas na tela são medidas verdadeiras.
- **Vidro** — shader próprio com fresnel, reflexão de duas softboxes analíticas,
  dois realces especulares e escurecimento abaixo da linha do vinho.
- **Vinho** — malha interna separada (1,5 L de volume real de corpo), com ruído
  lento de convecção e brilho rubi.
- **Rótulo** — desenhado em `<canvas>` na hora (2048×1024), aplicado num setor de
  cilindro colado no corpo. Papel algodão, grão procedural, sombreamento de
  cilindro nas bordas. Redesenha quando as fontes carregam, para nunca aparecer
  com fonte de fallback.
- **Cápsula** — metal com frisos verticais, costura e sombra do ombro.
- **Estúdio** — backdrop esférico com halo, piso com poço de luz, malha técnica e
  sombra de contato que respira junto com a flutuação.

## Os cinco planos

| # | plano | o que mostra |
| --- | --- | --- |
| 01 | garrafa | herói, giro contínuo, composição assimétrica |
| 02 | medidas | teleobjetiva, malha no piso, cotas projetadas em DOM |
| 03 | rótulo | close, garrafa "doca" de frente para a câmera |
| 04 | vidro | detalhe do gargalo e da cápsula, luz na borda |
| 05 | compra | preço, ficha e botão de sacola |

O scroll não troca de página: percorre uma sequência de câmeras e o produto
responde. Na cena técnica a garrafa **assenta de frente** para a câmera, em vez de
continuar girando — é o truque que faz o rótulo ficar legível como numa foto de
catálogo.

## Giro fluido

- Arraste em qualquer lugar: a velocidade vira inércia e a garrafa continua
  girando, desacelerando exponencialmente e assentando.
- Paralaxe de ponteiro move a câmera, não o objeto.
- Nos planos com `dock`, o alvo do giro é o azimute da câmera + um balanço de
  vitrine — o rótulo nunca fica de costas.
- Todas as suavizações usam **tempo real** (limitado a 0,5 s), não tempo de
  frame: o movimento tem a mesma duração a 30 ou 144 fps.

## Comprar (demo)

Botão de sacola funcional no cliente: contador, total, toast e pulso na cena.
Sem backend — é uma demonstração de produto, o checkout não existe.

## Terminal

`TERMINAL` no canto ou tecla `/`:

```
giro <0–3 | auto>     velocidade do giro
luz <#hex> [#hex]     cor da luz principal e do rim
cor <#hex>            cor do vidro
vinho <#hex>          cor do líquido
medidas               vai para o plano das medidas
comprar               põe uma garrafa na sacola
preco                 preço e condições
ir <1–5>              salta para um plano
som                   liga/desliga o ambiente sonoro
reiniciar             estado de fábrica
info                  estado atual
```

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

Precisa de WebGL. Em aparelho sem GPU decente cai para um tier leve
(menos poeira, 96 segmentos radiais, pixel ratio 1.35).

## Estrutura

```
index.html          página de produto (copy, ficha, sacola, terminal)
src/bottle.js       perfil da garrafa + shaders de vidro/vinho/rótulo/metal
src/scene.js        estúdio, piso, sombra, câmeras, giro com inércia
src/glsl.js         ruído, softboxes do estúdio, poeira
src/post.js         bloom + pass final (lente, grão, vinheta)
src/audio.js        ambiente sonoro procedural
src/style.css       tipografia, HUD, cotas, sacola
public/fonts/       Anton, JetBrains Mono, Instrument Serif (self-hosted)
```

## Notas

- Zero imagem no projeto: inclusive o rótulo, que é desenhado em canvas.
- Sem cookies, analytics ou requisições a terceiros.
- Uma nota de honestidade sobre as medidas: foram modeladas a partir das
  proporções de uma garrafa bordalesa real e usadas como copy do produto fictício;
  são consistentes entre a cena 3D, as cotas projetadas e a ficha técnica — mas
  são de um produto de referência, não de uma garrafa que existe.

Licença MIT.
