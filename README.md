# ANTIPADRÃO

> Um laboratório de não-lugares. Nenhum padrão de layout sobrevive aqui.

Não é uma landing page. É um organismo 3D que responde a scroll, arrasto, som e
comandos de terminal. Tudo o que você vê é geometria gerada em tempo real — não
existe uma única imagem, ícone ou modelo 3D no projeto.

## O que tem dentro

- **Matéria viva** — esfera deformada por ruído simplex 3D no vertex shader, com
  corpo escuro e bordas incandescentes (fresnel + derivadas em tela cheia).
- **Casca de arame** — estrutura exposta que gira em contra-fase ao núcleo.
- **240 estilhaços instanciados** orbitando com rotação própria (InstancedMesh).
- **9.000 partículas** de poeira em shader próprio, com cintilação e atenuação.
- **Grade infinita** abaixo do organismo, com pulso que atravessa o plano.
- **Pós-processamento** — bloom, aberração cromática radial, fatias de glitch,
  distorção de lente, grão analógico e vinheta.
- **Trilha procedural** — drone de 4 osciladores + delay em rede + textura de
  ruído. Nenhum arquivo de áudio; tudo sintetizado pelo WebAudio.
- **Terminal de matéria** — o mundo escuta comandos.
- **Cinco capítulos** costurados numa curva Catmull-Rom de câmera: a cena não
  troca de página, ela é atravessada.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o build
```

Precisa de WebGL. Em aparelhos sem GPU decente, o projeto cai automaticamente
para um modo leve (menos partículas, menos pixel ratio).

## Como atravessar

| ação | efeito |
| --- | --- |
| rolar | viaja entre os capítulos, a câmera percorre a curva |
| arrastar em qualquer lugar | dobra a órbita; solta e volta com elástico |
| mover o mouse | paralaxe e inclinação da câmera |
| `SOM` (canto inferior) | liga o drone procedural |
| `TERMINAL` ou `/` | abre o terminal de comandos |
| `c` | alterna o modo caos |
| `Esc` | fecha o terminal |

### Comandos do terminal

```
cor <#hex> [sec] [terc]   repinta toda a matéria
ruido <0–2.2>             amplitude da deformação
dispersao <0.2–3.4>       afasta os estilhaços
caos                      liga/desliga o modo caos
glitch                    injeta um choque na cena
ir <1–5>                  viaja para um capítulo
som                       liga/desliga o drone
reiniciar                 volta o organismo ao estado inicial
info                      estado atual (capítulo, fps, ruído)
limpar / ajuda
```

## Estrutura

```
index.html          marcação + portão de entrada
src/style.css       folha de matéria (tipografia, HUD, terminal)
src/main.js         orquestração: scroll, ponteiro, HUD, terminal
src/world.js        cena three.js, matéria, câmera, capítulos
src/glsl.js         shaders (ruído, núcleo, estilhaços, poeira, grade, nebulosa)
src/post.js         composer: bloom + pass final de lente/glitch/grão
src/audio.js        drone e efeitos procedurais (WebAudio)
public/fonts/       Anton, JetBrains Mono, Instrument Serif (self-hosted)
```

## Notas de projeto

- Fontes hospedadas localmente: nenhum CDN, nenhum pedido a terceiros.
- Sem cookies, sem analytics, sem newsletter, sem funil.
- `prefers-reduced-motion` desliga grão animado, marquee e pulso do portão.
- Acessibilidade: capítulos são landmarks com `aria-label`, o índice é navegável
  por teclado, o terminal usa `aria-live`.

Licença MIT. Faça o que quiser — só não transforme isto num template de agência
com cards e depoimentos.
