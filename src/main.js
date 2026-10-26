import './style.css';
import * as THREE from 'three';
import { ProductScene, CHAPTERS } from './scene.js';
import { Post } from './post.js';
import { Drone } from './audio.js';

/* ────────────────────────────────────────────────────────────
   NÃO-LUGAR · garrafa nº 01 — orquestração
   scroll = plano de câmera · arrasto = giro · terminal = matéria
   ──────────────────────────────────────────────────────────── */

const N = CHAPTERS.length;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;
const isSmall = window.innerWidth < 820;
const lowPower = isTouch || isSmall || (navigator.hardwareConcurrency || 8) <= 4;

const QUALITY = lowPower
  ? { dust: 1600, radialSegments: 96, pixelRatio: 1.35 }
  : { dust: 3200, radialSegments: 128, pixelRatio: 1.6 };

const PRICE = 289;

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
document.body.classList.add('gated');

/* ───────────────────────────── estado ───────────────────────────── */

let scene = null;
let post = null;
let drone = null;
let started = false;
let elapsed = 0;
let progress = 0;
let chapterFloat = 0;
let targetChapter = 0;
let fps = 60;
let fpsAcc = 0;
let fpsCount = 0;
let lastFrame = performance.now();
let hudClock = 0;
let pointer = { x: 0, y: 0 };
let dragging = false;
let dragPointerId = null;
let dragLast = 0;
let cart = { n: 0, total: 0 };
let toastTimer = 0;

const _proj = new THREE.Vector3();

/* ───────────────────────────── construção ───────────────────────────── */

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

function build() {
  const canvas = $('#gl');
  if (!hasWebGL()) {
    document.body.classList.add('no-webgl');
    $('#gate').insertAdjacentHTML(
      'beforeend',
      '<div class="fallback">Seu dispositivo não expõe WebGL.<br><br>A garrafa continua existindo — só não gira aqui.</div>'
    );
    return false;
  }

  try {
    scene = new ProductScene(canvas, QUALITY);
    post = new Post(
      scene.renderer,
      scene.scene,
      scene.camera,
      window.innerWidth,
      window.innerHeight,
      QUALITY.pixelRatio
    );
  } catch (err) {
    console.error('[NÃO-LUGAR] falha ao montar a garrafa', err);
    document.body.classList.add('no-webgl');
    $('#gate').insertAdjacentHTML(
      'beforeend',
      `<div class="fallback">A garrafa não pôde ser montada neste dispositivo.<br><br><small>${String(
        err.message || err
      )}</small></div>`
    );
    return false;
  }

  drone = new Drone();
  return true;
}

/* ───────────────────────────── índice / navegação ───────────────────────────── */

function buildIndex() {
  const ol = $('#index ol');
  ol.innerHTML = CHAPTERS.map(
    (c, i) =>
      `<li><button type="button" data-go="${i}"><span class="lbl">${c.label}</span><span class="n">0${i + 1}</span></button></li>`
  ).join('');

  ol.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) goToChapter(Number(b.dataset.go));
  });
}

function goToChapter(i) {
  const max = document.documentElement.scrollHeight - innerHeight;
  const top = clamp(i / (N - 1), 0, 1) * max;
  const start = window.scrollY;
  const useSmooth = !reduceMotion && fps >= 24 && Math.abs(top - start) > 4;

  window.scrollTo({ top, behavior: useSmooth ? 'smooth' : 'auto' });

  if (useSmooth) {
    setTimeout(() => {
      if (Math.abs(window.scrollY - start) < 4) window.scrollTo({ top, behavior: 'auto' });
    }, 320);
  }

  drone?.blip(520 + i * 60, 0.16, 'sine', 0.03);
}

function updateChapters(dt) {
  if (Math.abs(targetChapter - chapterFloat) > 1.2) chapterFloat = targetChapter;
  chapterFloat = lerp(chapterFloat, targetChapter, 1 - Math.exp(-dt * 11));
  if (Math.abs(targetChapter - chapterFloat) < 0.002) chapterFloat = targetChapter;

  $$('.chapter').forEach((el, i) => {
    const d = Math.abs(chapterFloat - i);
    const vis = smooth(clamp((0.72 - d) / 0.5, 0, 1));

    el.style.opacity = vis.toFixed(3);
    el.style.transform = `translate3d(0, ${((chapterFloat - i) * -7).toFixed(2)}vh, 0) scale(${(
      1 +
      (1 - vis) * 0.03
    ).toFixed(4)})`;
    el.style.filter = vis < 0.98 && vis > 0.01 ? `blur(${((1 - vis) * 5).toFixed(2)}px)` : 'none';
    el.classList.toggle('live', vis > 0.02);

    el.querySelectorAll('.ch-title > span').forEach((s, k) => {
      s.style.transform = `translate3d(${((chapterFloat - i) * (10 + k * 7) * -1).toFixed(1)}px, 0, 0)`;
    });
  });

  const idx = Math.round(chapterFloat);
  $$('#index button').forEach((b, i) => {
    if (i === idx) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
}

/* ───────────────────────────── scroll ───────────────────────────── */

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
  targetChapter = progress * (N - 1);
  scene?.setChapter(targetChapter);
  $('#bar').style.width = `${(progress * 100).toFixed(2)}%`;
}

function setSpacerHeight() {
  const mobile = window.innerWidth <= 820;
  $('#spacer').style.height = `${N * (mobile ? 178 : 140)}vh`;
  onScroll();
}

/* ───────────────────────────── entrada / áudio ───────────────────────────── */

async function enter() {
  if (started) return;
  started = true;

  const gate = $('#gate');
  gate.classList.add('gone');
  document.body.classList.remove('gated');
  document.body.classList.add('entered');
  window.scrollTo(0, 0);

  scene?.pulse(1.6);

  try {
    await drone.enable();
    setSoundUI(true);
    drone.chord();
  } catch (err) {
    console.warn('[NÃO-LUGAR] áudio bloqueado', err);
    setSoundUI(false);
  }

  setTimeout(() => gate.remove(), 1400);
}

function setSoundUI(on) {
  const btn = $('#btn-sound');
  btn.setAttribute('aria-pressed', String(on));
  btn.querySelector('span').textContent = on ? 'ON' : 'OFF';
}

/* ───────────────────────────── sacola ───────────────────────────── */

function updateCartUI() {
  const count = $('#cart-count');
  const total = $('#cart-total');
  count.textContent = String(cart.n);
  count.classList.toggle('empty', cart.n === 0);
  total.textContent = `R$ ${cart.total.toLocaleString('pt-BR')}`;

  const pill = $('#cart-btn');
  pill.classList.remove('bump');
  void pill.offsetWidth;
  pill.classList.add('bump');
}

function addToCart() {
  cart.n += 1;
  cart.total += PRICE;
  updateCartUI();
  toast(`1 × garrafa nº 01 · R$ ${PRICE} — na sacola`);
  scene?.pulse(0.7);
  drone?.blip(880, 0.22, 'sine', 0.04);
  setTimeout(() => drone?.blip(1320, 0.16, 'sine', 0.03), 90);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}

/* ───────────────────────────── cotas ───────────────────────────── */

function projectPoint(p) {
  _proj.copy(p).project(scene.camera);
  return {
    x: (_proj.x * 0.5 + 0.5) * window.innerWidth,
    y: (-_proj.y * 0.5 + 0.5) * window.innerHeight,
  };
}

function updateMedidas() {
  const wrap = $('#medidas');
  if (!scene) return;

  const vis = clamp((0.55 - Math.abs(chapterFloat - 1)) / 0.35, 0, 1);
  wrap.classList.toggle('on', vis > 0.02);
  wrap.style.opacity = vis.toFixed(3);
  if (vis < 0.02 || window.innerWidth <= 820) return;

  const m = scene.getMeasurePoints();
  const base = projectPoint(m.base);
  const top = projectPoint(m.top);
  const left = projectPoint(m.left);
  const right = projectPoint(m.right);
  const neckL = projectPoint(m.neckLeft);
  const neckR = projectPoint(m.neckRight);

  // altura total: linha fora do corpo, à esquerda
  const hx = Math.min(left.x, right.x) - 92;
  const yTop = Math.min(top.y, base.y);
  const h = Math.abs(base.y - top.y);
  const elH = $('#m-h');
  elH.style.transform = `translate3d(${hx.toFixed(1)}px, ${yTop.toFixed(1)}px, 0)`;
  elH.style.height = `${h.toFixed(1)}px`;

  // diâmetro do corpo
  const yMid = (left.y + right.y) * 0.5;
  const w = Math.abs(right.x - left.x);
  const elW = $('#m-w');
  elW.style.transform = `translate3d(${Math.min(left.x, right.x).toFixed(1)}px, ${yMid.toFixed(1)}px, 0)`;
  elW.style.width = `${w.toFixed(1)}px`;

  // gargalo
  const elN = $('#m-n');
  elN.style.transform = `translate3d(${Math.max(neckL.x, neckR.x).toFixed(1)}px, ${(
    (neckL.y + neckR.y) *
    0.5
  ).toFixed(1)}px, 0)`;
}

/* ───────────────────────────── ponteiro / giro ───────────────────────────── */

function initPointer() {
  const cursorEl = $('#cursor');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (fine) {
    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'touch') return;
        cursorEl.classList.add('on');
        cursorEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
        scene?.setPointer(pointer.x, pointer.y);
      },
      { passive: true }
    );

    window.addEventListener(
      'pointerover',
      (e) => cursorEl.classList.toggle('hot', !!e.target.closest('a, button, input, .spec dd')),
      { passive: true }
    );
    window.addEventListener('pointerout', () => cursorEl.classList.remove('hot'), { passive: true });
  } else {
    cursorEl.remove();
  }

  // arrasto gira a garrafa com inércia
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, input, .terminal, .hud-index, .gate')) return;
    dragging = true;
    dragPointerId = e.pointerId;
    dragLast = e.clientX;
    if (e.pointerType !== 'touch') document.body.style.userSelect = 'none';
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging || e.pointerId !== dragPointerId) return;
      const dx = e.clientX - dragLast;
      dragLast = e.clientX;
      scene?.dragSpin(dx);
    },
    { passive: true }
  );

  const end = (e) => {
    if (e.pointerId !== dragPointerId) return;
    dragging = false;
    dragPointerId = null;
    document.body.style.userSelect = '';
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}

/* ───────────────────────────── terminal ───────────────────────────── */

const term = { el: null, log: null, input: null, open: false };

function termPrint(text, cls = '') {
  const line = document.createElement('div');
  line.className = `ln ${cls}`;
  line.textContent = text;
  term.log.appendChild(line);
  term.log.scrollTop = term.log.scrollHeight;
}

function initTerminal() {
  term.el = $('#terminal');
  term.log = $('#term-log');
  term.input = $('#term-input');

  $('#btn-console').addEventListener('click', () => toggleTerminal());
  $('#term-close').addEventListener('click', () => toggleTerminal(false));

  $('#term-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = term.input.value.trim();
    if (!v) return;
    term.input.value = '';
    runCommand(v);
  });

  termPrint('console do produto v1.0 — digite "ajuda"', 'sys');
  termPrint('a garrafa responde a comandos. gire, pinte, compre.', 'sys');
}

function toggleTerminal(force) {
  const open = typeof force === 'boolean' ? force : !term.open;
  term.open = open;
  term.el.hidden = !open;
  if (open) {
    setTimeout(() => term.input.focus(), 40);
    drone?.blip(1040, 0.08, 'square', 0.02);
  } else {
    term.input.blur();
  }
}

const COMMANDS = {
  ajuda() {
    [
      'giro <0–3 | auto>        · velocidade do giro',
      'luz <#hex> [#hex]        · cor da luz principal e do rim',
      'cor <#hex>               · cor do vidro',
      'vinho <#hex>             · cor do líquido',
      'medidas                  · vai para o plano das medidas',
      'comprar                  · põe uma garrafa na sacola',
      'preco                    · preço e condições',
      'ir <1–5>                 · salta para um plano',
      'som                      · liga/desliga o ambiente sonoro',
      'reiniciar                · volta a garrafa ao estado de fábrica',
      'info                     · estado atual',
      'limpar                   · limpa este log',
    ].forEach((l) => termPrint(l, 'ok'));
  },
  help() {
    COMMANDS.ajuda();
  },
  giro(args) {
    if (!args.length) return termPrint('uso: giro 0.6   ·   giro auto', 'err');
    if (args[0] === 'auto') {
      scene.spinOverride = undefined;
      termPrint('giro automático restaurado', 'ok');
      return;
    }
    const v = parseFloat(args[0]);
    if (isNaN(v)) return termPrint('valor inválido', 'err');
    scene?.setSpin(v);
    termPrint(`giro = ${clamp(v, 0, 3).toFixed(2)} rad/s`, 'ok');
  },
  luz(args) {
    const valid = (s) => s && window.CSS && CSS.supports('color', s);
    const c = args.filter(valid);
    if (!c.length) return termPrint('uso: luz #fff1e2 #7fd8ff', 'err');
    scene?.setLights(c[0], c[1] || null);
    termPrint(`luz: ${c.join(' / ')}`, 'ok');
  },
  cor(args) {
    if (!args[0]) return termPrint('uso: cor #0d2a22', 'err');
    scene?.setGlassTint(args[0]);
    termPrint(`vidro: ${args[0]}`, 'ok');
  },
  vinho(args) {
    if (!args[0]) return termPrint('uso: vinho #4e0b1c', 'err');
    scene?.setLiquidTint(args[0]);
    termPrint(`líquido: ${args[0]}`, 'ok');
  },
  medidas() {
    goToChapter(1);
    termPrint('abrindo o plano das medidas', 'ok');
  },
  comprar() {
    addToCart();
    termPrint('garrafa adicionada à sacola', 'ok');
  },
  preco() {
    termPrint('R$ 289,00 à vista · 3× de R$ 96,33 · frete na sacola', 'ok');
  },
  ir(args) {
    const i = parseInt(args[0], 10);
    if (isNaN(i) || i < 1 || i > N) return termPrint(`uso: ir 1..${N}`, 'err');
    goToChapter(i - 1);
    termPrint(`plano ${i}`, 'ok');
  },
  som() {
    if (!drone) return termPrint('áudio indisponível', 'err');
    if (drone.on) {
      drone.disable();
      setSoundUI(false);
      termPrint('ambiente silenciado', 'sys');
    } else {
      drone.enable().then(() => {
        setSoundUI(true);
        drone.chord();
        termPrint('ambiente ativo', 'ok');
      });
    }
  },
  reiniciar() {
    goToChapter(0);
    scene?.setLights('#fff1e2', '#7fd8ff');
    scene?.setGlassTint('#0d2a22');
    scene?.setLiquidTint('#4e0b1c');
    scene.spinOverride = undefined;
    termPrint('garrafa de volta ao estado de fábrica', 'ok');
  },
  limpar() {
    term.log.innerHTML = '';
  },
  info() {
    termPrint(`plano ${(chapterFloat + 1).toFixed(2)}/${N} · giro ${(scene?.spinSpeed ?? 0).toFixed(2)} rad/s`, 'sys');
    termPrint(`sacola ${cart.n} · R$ ${cart.total} · fps ${fps.toFixed(0)}`, 'sys');
  },
};

function runCommand(raw) {
  termPrint(`> ${raw}`, 'in');
  const [cmd, ...args] = raw.trim().toLowerCase().split(/\s+/);
  const fn = COMMANDS[cmd];
  if (!fn) {
    termPrint(`comando desconhecido: "${cmd}" — tente "ajuda"`, 'err');
    drone?.blip(180, 0.12, 'square', 0.03);
    return;
  }
  try {
    fn(args);
  } catch (err) {
    termPrint(String(err.message || err), 'err');
  }
}

/* ───────────────────────────── HUD ───────────────────────────── */

function updateHUD() {
  if (scene) {
    const p = scene.camera.position;
    const f = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
    $('#coords').textContent = `X ${f(p.x)}  Y ${f(p.y)}  Z ${f(p.z)}`;
  }

  const idx = Math.round(chapterFloat);
  const ch = CHAPTERS[idx];
  const spin = (scene?.spinSpeed ?? 0).toFixed(2);
  $('#readout').textContent =
    `PLANO ${String(idx + 1).padStart(2, '0')}/${String(N).padStart(2, '0')} · ${ch.label.toUpperCase()}\n` +
    `GIRO ${spin} RAD/S · SACOLA ${cart.n}\n` +
    `FPS ${fps.toFixed(0)} · ${(progress * 100).toFixed(0)}%`;
}

/* ───────────────────────────── eventos ───────────────────────────── */

function initEvents() {
  $('#enter').addEventListener('click', enter);
  $('#buy').addEventListener('click', addToCart);
  $('#go-measure').addEventListener('click', () => goToChapter(1));
  $('#cart-btn').addEventListener('click', () => {
    if (cart.n === 0) {
      goToChapter(N - 1);
      toast('a sacola está vazia — escolha uma garrafa');
    } else {
      toast(`${cart.n} × garrafa nº 01 · R$ ${cart.total.toLocaleString('pt-BR')}`);
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    scene?.resize(window.innerWidth, window.innerHeight);
    post?.resize(window.innerWidth, window.innerHeight);
    setSpacerHeight();
  });

  $('#btn-sound').addEventListener('click', async () => {
    if (!drone) return;
    if (drone.on) {
      drone.disable();
      setSoundUI(false);
    } else {
      await drone.enable();
      setSoundUI(true);
      drone.chord();
    }
  });

  window.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea');
    if (!typing && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k'))) {
      e.preventDefault();
      toggleTerminal(true);
      return;
    }
    if (e.key === 'Escape') {
      toggleTerminal(false);
      return;
    }
    if (!typing && e.key === 'Enter' && !started) enter();
    if (!typing && (e.key === 'm' || e.key === 'M')) goToChapter(1);
  });

  // troca de plano → som
  let lastIdx = -1;
  window.addEventListener(
    'scroll',
    () => {
      const idx = Math.round(progress * (N - 1));
      if (idx !== lastIdx) {
        lastIdx = idx;
        drone?.setChapter(idx);
        if (started && drone?.on) drone.blip(360 + idx * 70, 0.24, 'sine', 0.022);
      }
    },
    { passive: true }
  );
}

/* ───────────────────────────── loop ───────────────────────────── */

function tick(now) {
  const rawDt = (now - lastFrame) / 1000;
  const dt = clamp(rawDt, 0, 0.05);
  const ease = clamp(rawDt, 0, 0.5);
  lastFrame = now;

  if (!document.hidden) {
    elapsed += dt;

    fpsAcc += Math.max(rawDt, 0.0001);
    fpsCount++;
    if (fpsAcc > 0.5) {
      fps = fpsCount / fpsAcc;
      fpsAcc = 0;
      fpsCount = 0;
    }

    if (scene) scene.update(dt, ease);
    updateChapters(ease);
    updateMedidas();

    if (scene && post) {
      post.setBloom(scene.bloomTarget);
      post.setAberration(scene.postAberration);
      post.update(ease, elapsed, scene.postAmount);
      post.render(ease);
    }

    hudClock += dt;
    if (hudClock > 0.12) {
      hudClock = 0;
      updateHUD();
    }
  }

  requestAnimationFrame(tick);
}

/* ───────────────────────────── boot ───────────────────────────── */

function boot() {
  buildIndex();
  initTerminal();
  initPointer();
  initEvents();
  setSpacerHeight();
  updateCartUI();

  if (build()) {
    scene.setChapter(0);
    post.setBloom(CHAPTERS[0].bloom);
    drone.setChapter(0);
    onScroll();
  }

  requestAnimationFrame((t) => {
    lastFrame = t;
    requestAnimationFrame(tick);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
