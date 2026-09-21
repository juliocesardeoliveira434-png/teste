# 🎹 Teclaton

**Seu teclado é um instrumento.** Cada tecla toca um som e dispara uma animação — inspirado no clássico [Patatap](https://patatap.com) (Jono Brandel & Lullatone), mas com **muito mais variedade sonora**.

> **288 sons** · **8 universos sonoros** · **20 animações** · 100% offline, sem arquivos de áudio, sem APIs, sem chave nenhuma.

## ▶ Como usar (rodar agora)

**Jeito 1 — abrir direto:** dê dois cliques no `index.html`. Pronto.

**Jeito 2 — localhost (recomendado):**

```bash
cd teclaton   # pasta do projeto
python3 -m http.server 8080
# abra http://localhost:8080
```

**Jeito 3 — GitHub Pages (hospedagem de graça, pra sempre):**

1. Se o repositório for **privado**, deixe-o público: **Settings → General → Danger Zone → Change visibility** (no plano gratuito o Pages só publica repositórios públicos);
2. Faça merge do PR e/ou garanta o push deste branch no GitHub;
3. No repositório: **Settings → Pages → Build and deployment**;
4. Em *Source*, escolha o branch (ex.: `main` após o merge) e a pasta `/ (root)`;
5. Em ~1 minuto o site fica no ar em `https://SEUUSUARIO.github.io/NOME-DO-REPO/`.

> Não é possível publicar do privado com conta gratuita: o próprio GitHub bloqueia. Nenhuma etapa precisa de chave de API ou serviço externo — o GitHub Pages é gratuito para repositórios públicos.

## 🎮 Controles

| Tecla / gesto                     | Ação                                          |
|---------------------------------|-----------------------------------------------|
| `A`–`Z`                           | cada letra = 1 som + 1 animação               |
| `1`–`0`                           | golpes especiais (acordes, glissandos, trovões, gongos…) |
| `Espaço`                          | troca o universo sonoro                       |
| clicar / tocar na tela            | toca a nota daquela posição (esquerda = grave) |
| 2 dedos (celular)                 | dispara um golpe especial                     |
| `Esc`                             | fecha a ajuda / para a demo                   |

## 🎛 Recursos

- **▶ Demo** — toca uma sequência de demonstração do universo atual;
- **⏺ Gravar** — grava **vídeo + áudio** da sua sessão em `.webm` e baixa na hora (tudo local, via `MediaRecorder`, nada sobe pra internet);
- **🔊** — volume com memória (fica salvo junto com o último universo);
- **⛶** — tela cheia.

## 🌌 Os 8 universos

| Universo | Emoji | Clima |
|---|---|---|
| Clássico | 🎹 | marimbas, sinos e bateria limpa (homenagem ao Patatap original) |
| Lo-Fi Chill | 🌙 | kalimba com poeira de vinil, 808 e chuva |
| Synthwave | 🌆 | leads saw, bass pulsante e lasers noturnos |
| 8-Bit | 🕹️ | blips de Game Boy, moedas e power-ups |
| Natureza | 🌿 | gotas, pássaros, grilos, vento e trovão |
| Mundo | 🥁 | congas, djembe, tabla, berimbau e apito |
| Cinema | 🎬 | tímpanos, gongos, harpa, cordas e coro |
| Sci-Fi | 🛸 | lasers, radar, OVNIs, warp e robôs |

## 🧠 Como funciona

- **Som:** [Web Audio API](https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Audio_API). Todos os 71 timbres são **sintetizados em tempo real** (osciladores, ruído, FM, síntese subtrativa, reverb por convolução com impulso gerado em código, delay com feedback). Não existe **nenhum** arquivo `.mp3`/`.wav` no projeto.
- **Visual:** Canvas 2D com 20 formas animadas, composição aditiva (glow) e transição suave de paleta entre universos.
- **Sem dependências:** zero frameworks, zero CDNs, zero build. 4 arquivos JS puros.

```
index.html      ← página única
css/style.css   ← estilos
js/audio.js     ← motor de som (71 timbres sintetizados)
js/packs.js     ← os 8 universos × 36 teclas
js/visuals.js   ← motor visual (20 formas)
js/app.js       ← teclado, demo, gravação, UI
```

## 📱 Compatibilidade

Funciona em qualquer navegador moderno (Chrome, Edge, Firefox, Safari), desktop e celular. A gravação de vídeo usa `MediaRecorder` — disponível em todos menos alguns navegadores antigos; nesse caso o botão fica desabilitado e o resto funciona normalmente.

---

*Projeto de estudo/homenagem ao Patatap. Feito com ❤️ e Web Audio.*
