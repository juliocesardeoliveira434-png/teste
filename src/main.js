import './style.css';
import { World, CHAPTERS } from './world.js';
import { Post } from './post.js';
import { Drone } from './audio.js';

/* ────────────────────────────────────────────────────────────
   ANTIPADRÃO — orquestração
   sem framework, sem grade, sem hero. só tempo, ruído e matéria.
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
  ? { dust: 4200, shards: 150, coreDetail: 18, pixelRatio: 1.35 }
  : { dust: 9000, shards: 240, coreDetail: 24, pixelRatio: 1.6 };

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.body.classList.add('gated');

/* ───────────────────────────── estado ───────────────────────────── */

let world = null;
let post = null;
let drone = null;
let started = false;
let elapsed = 0;
let progress = 0;
let chapterFloat = 0;
let targetChapter = 0;
let chaos = false;
let lastFrame = performance.now();
let fps = 60;
let fpsAcc = 0;
let fpsCount = 0;
let hudClock = 0;
let pointer = { x: 0, y: 0 };
let drag = { yaw: 0, pitch: 0 };
let dragging = false;
let dragPointerId = null;
let dragStart = { x: 0, y: 0 };
let dragBase = { yaw: 0, pitch: 0 };

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
      '<div class="fallback">Seu dispositivo não expõe WebGL.<br><br>Ainda assim: nada aqui segue o padrão.</div>'
    );
    return false;
  }

  try {
    world = new World(canvas, QUALITY);
    post = new Post(
      world.renderer,
      world.scene,
      world.camera,
      window.innerWidth,
      window.innerHeight,
      QUALITY.pixelRatio
    );
  } catch (err) {
    console.error('[ANTIPADRÃO] falha ao iniciar matéria', err);
    document.body.classList.add('no-webgl');
    $('#gate').insertAdjacentHTML(
      'beforeend',
      `<div class="fallback">A matéria não pôde ser compilada neste dispositivo.<br><br><small>${String(
        err.message || err
      )}</small></div>`
    );
    return false;
  }

  drone = new Drone();
  return true;
}

/* ───────────────────────────── HUD / índice ───────────────────────────── */

function buildIndex() {
  const ol = $('#index ol');
  ol.innerHTML = CHAPTERS.map(
    (c, i) =>
      `<li><button type="button" data-go="${i}"><span class="lbl">${c.label}</span><span class="n">0${i + 1}</span></button></li>`
  ).join('');

  ol.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    goToChapter(Number(b.dataset.go));
  });
}

function goToChapter(i) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const top = clamp(i / (N - 1), 0, 1) * max;
  const start = window.scrollY;
  // scroll suave só quando a máquina consegue animar; senão salta direto
  const useSmooth = !reduceMotion && fps >= 24 && Math.abs(top - start) > 4;

  window.scrollTo({ top, behavior: useSmooth ? 'smooth' : 'auto' });

  if (useSmooth) {
    // vigia: se o suave não engatar (compositor lento ou aba oculta), salta
    setTimeout(() => {
      if (Math.abs(window.scrollY - start) < 4) window.scrollTo({ top, behavior: 'auto' });
    }, 320);
  }

  drone?.blip(660 + i * 55, 0.14, 'triangle', 0.03);
}

function updateChapterDOM(dt) {
  // tempo real (até 0,5 s): a transição leva o mesmo tempo em qualquer máquina
  if (Math.abs(targetChapter - chapterFloat) > 1.2) chapterFloat = targetChapter;
  chapterFloat = lerp(chapterFloat, targetChapter, 1 - Math.exp(-dt * 11));
  if (Math.abs(targetChapter - chapterFloat) < 0.002) chapterFloat = targetChapter;

  $$('.chapter').forEach((el, i) => {
    const d = Math.abs(chapterFloat - i);
    const vis = smooth(clamp((0.72 - d) / 0.5, 0, 1));

    el.style.opacity = vis.toFixed(3);
    const y = (chapterFloat - i) * -7;
    const sc = 1 + (1 - vis) * 0.035;
    el.style.transform = `translate3d(0, ${y}vh, 0) scale(${sc.toFixed(4)})`;
    el.style.filter = vis < 0.98 && vis > 0.01 ? `blur(${((1 - vis) * 5).toFixed(2)}px)` : 'none';
    el.classList.toggle('live', vis > 0.02);

    const spans = el.querySelectorAll('.ch-title > span');
    spans.forEach((s, k) => {
      s.style.transform = `translate3d(${(chapterFloat - i) * (12 + k * 8) * -1}px, 0, 0)`;
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
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
  targetChapter = progress * (N - 1);

  const idx = Math.round(progress * (N - 1));
  if (world) {
    world.setChapter(progress * (N - 1));
    post?.setBloom(CHAPTERS[idx].bloom);
  }

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

  if (world) {
    world.pulse(1.8);
    post?.setBloom(1.6);
    setTimeout(() => post?.setBloom(CHAPTERS[0].bloom), 1400);
  }

  try {
    await drone.enable();
    setSoundUI(true);
    drone.chord();
  } catch (err) {
    console.warn('[ANTIPADRÃO] áudio bloqueado', err);
    setSoundUI(false);
  }

  setTimeout(() => gate.remove(), 1400);
}

function setSoundUI(on) {
  const btn = $('#btn-sound');
  btn.setAttribute('aria-pressed', String(on));
  btn.querySelector('span').textContent = on ? 'ON' : 'OFF';
}

/* ───────────────────────────── ponteiro / cursor ───────────────────────────── */

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

        if (world) world.setPointer(pointer.x, pointer.y);
      },
      { passive: true }
    );

    const hot = (e) => {
      const t = e.target.closest('a, button, input, .strike li, code');
      cursorEl.classList.toggle('hot', !!t);
    };
    window.addEventListener('pointerover', hot, { passive: true });
    window.addEventListener('pointerout', () => cursorEl.classList.remove('hot'), { passive: true });
  } else {
    cursorEl.remove();
  }

  // arrasto para dobrar a cena
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, input, .terminal, .hud-index, .gate')) return;
    dragging = true;
    dragPointerId = e.pointerId;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    dragBase.yaw = drag.yaw;
    dragBase.pitch = drag.pitch;
    if (e.pointerType !== 'touch') document.body.style.userSelect = 'none';
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging || e.pointerId !== dragPointerId) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      drag.yaw = clamp(dragBase.yaw - dx * 0.0042, -1.1, 1.1);
      drag.pitch = clamp(dragBase.pitch - dy * 0.0032, -0.75, 0.75);
      if (world) world.setDrag(drag.yaw, drag.pitch);
    },
    { passive: true }
  );

  const endDrag = (e) => {
    if (e.pointerId !== dragPointerId) return;
    dragging = false;
    dragPointerId = null;
    document.body.style.userSelect = '';
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}

/* ───────────────────────────── terminal ───────────────────────────── */

const term = {
  el: null,
  log: null,
  input: null,
  open: false,
};

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
  const form = $('#term-form');

  $('#btn-console').addEventListener('click', () => toggleTerminal());
  $('#open-console').addEventListener('click', () => toggleTerminal(true));
  $('#term-close').addEventListener('click', () => toggleTerminal(false));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = term.input.value.trim();
    if (!value) return;
    term.input.value = '';
    runCommand(value);
  });

  termPrint('terminal de matéria v0.1 — digite "ajuda"', 'sys');
  termPrint('nada aqui obedece convenção. inclusive estes comandos.', 'sys');
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
    const lines = [
      'cor <#hex> [secundária] [terciária]  · repinta a matéria',
      'ruido <0–2.2>                         · amplitude da deformação',
      'dispersao <0.2–3.4>                  · afasta os estilhaços',
      'caos                                 · liga/desliga o modo caos',
      'glitch                               · choque elétrico na cena',
      'ir <1–5>                             · viaja para um capítulo',
      'som                                  · liga/desliga o drone',
      'reiniciar                            · volta ao início',
      'limpar                               · limpa este log',
      'info                                 · estado do organismo',
    ];
    lines.forEach((l) => termPrint(l, 'ok'));
  },
  help() {
    COMMANDS.ajuda();
  },
  cor(args) {
    const valid = (s) => s && window.CSS && CSS.supports('color', s);
    if (!args.length) return termPrint('uso: cor #ff2e88  (ou: cor sem cor)', 'err');
    const c = args.filter((a) => valid(a));
    if (!c.length) return termPrint('cor inválida — tente #ff2e88, #0ff, "tomato"', 'err');
    world?.setPalette(c[0], c[1], c[2]);
    world?.pulse(0.5);
    termPrint(`matéria repintada: ${c.join(' / ')}`, 'ok');
    drone?.blip(760, 0.2, 'sine', 0.04);
  },
  ruido(args) {
    const v = parseFloat(args[0]);
    if (isNaN(v)) return termPrint('uso: ruido 1.4   (0 a 2.2)', 'err');
    world?.setNoiseLevel(v);
    world?.pulse(0.3);
    termPrint(`deformação = ${clamp(v, 0, 2.2).toFixed(2)}`, 'ok');
  },
  dispersao(args) {
    const v = parseFloat(args[0]);
    if (isNaN(v)) return termPrint('uso: dispersao 2.0   (0.2 a 3.4)', 'err');
    world?.setSpread(v);
    termPrint(`dispersão = ${clamp(v, 0.2, 3.4).toFixed(2)}`, 'ok');
  },
  caos() {
    chaos = !chaos;
    world?.setChaos(chaos);
    setChaosUI(chaos);
    termPrint(`modo caos: ${chaos ? 'ATIVO' : 'desligado'}`, chaos ? 'ok' : 'sys');
    drone?.sweep();
  },
  glitch() {
    world?.pulse(2);
    termPrint('ruído injetado.', 'ok');
    drone?.blip(140, 0.5, 'sawtooth', 0.05);
  },
  ir(args) {
    const i = parseInt(args[0], 10);
    if (isNaN(i) || i < 1 || i > N) return termPrint(`uso: ir 1..${N}`, 'err');
    goToChapter(i - 1);
    termPrint(`viajando para o capítulo ${i}`, 'ok');
  },
  som() {
    if (!drone) return termPrint('áudio indisponível', 'err');
    if (drone.on) {
      drone.disable();
      setSoundUI(false);
      termPrint('drone silenciado', 'sys');
    } else {
      drone.enable().then(() => {
        setSoundUI(true);
        drone.chord();
        termPrint('drone ativo', 'ok');
      });
    }
  },
  reiniciar() {
    goToChapter(0);
    world?.setPalette(...CHAPTERS[0].pal);
    world?.setNoiseLevel(1);
    world?.setSpread(1);
    world?.setChaos(false);
    chaos = false;
    setChaosUI(false);
    termPrint('organismo reiniciado', 'ok');
  },
  limpar() {
    term.log.innerHTML = '';
  },
  info() {
    termPrint(
      `capítulo ${(chapterFloat + 1).toFixed(2)}/${N} · progresso ${(progress * 100).toFixed(0)}% · fps ${fps.toFixed(0)}`,
      'sys'
    );
    termPrint(`caos ${chaos ? 'on' : 'off'} · som ${drone?.on ? 'on' : 'off'} · glitch ${(world?.glitchAmount ?? 0).toFixed(2)}`, 'sys');
  },
  sobre() {
    termPrint('ANTIPADRÃO — laboratório de não-lugares. three.js, shaders próprios, áudio procedural.', 'sys');
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
  if (world) {
    const p = world.camPos;
    const f = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3);
    $('#coords').textContent = `X ${f(p.x)}   Y ${f(p.y)}   Z ${f(p.z)}`;
  }

  const idx = Math.round(chapterFloat);
  const noise = (world?.U.uAmp.value ?? 0).toFixed(2);
  const spread = (world?.currentSpread ?? 0).toFixed(2);
  const gl = (world?.glitchAmount ?? 0).toFixed(2);
  $('#readout').textContent =
    `CAP ${String(idx + 1).padStart(2, '0')}/${String(N).padStart(2, '0')} · ${CHAPTERS[idx].label.toUpperCase()}\n` +
    `RUÍDO ${noise} · DISPERSÃO ${spread} · CAOS ${gl}\n` +
    `FPS ${fps.toFixed(0)} · ${(progress * 100).toFixed(0)}%`;
}

function setChaosUI(on) {
  const btn = $('#btn-chaos');
  btn.setAttribute('aria-pressed', String(on));
  btn.querySelector('span').textContent = on ? 'ON' : 'OFF';
}

/* ───────────────────────────── eventos ───────────────────────────── */

function initEvents() {
  $('#enter').addEventListener('click', enter);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    world?.resize(window.innerWidth, window.innerHeight);
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

  $('#btn-chaos').addEventListener('click', () => {
    chaos = !chaos;
    world?.setChaos(chaos);
    setChaosUI(chaos);
    drone?.sweep();
  });

  $('#btn-restart').addEventListener('click', () => {
    COMMANDS.reiniciar();
    drone?.blip(520, 0.3, 'triangle', 0.04);
  });

  // teclado
  window.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea');
    if ((e.key === '/' || e.key === 'k') && (e.key === '/' ? !typing : e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      toggleTerminal(true);
      return;
    }
    if (e.key === 'Escape') {
      toggleTerminal(false);
      return;
    }
    if (!typing && started) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        // deixa o scroll nativo agir
      }
      if (e.key === 'c') {
        chaos = !chaos;
        world?.setChaos(chaos);
        setChaosUI(chaos);
      }
    }
    if (e.key === 'Enter' && !started && document.activeElement !== $('#enter')) {
      enter();
    }
  });

  // troca de capítulo → som
  let lastIdx = -1;
  window.addEventListener('scroll', () => {
    const idx = Math.round(progress * (N - 1));
    if (idx !== lastIdx) {
      lastIdx = idx;
      drone?.setChapter(idx);
      if (started && drone?.on) drone.blip(440 + idx * 70, 0.22, 'sine', 0.025);
    }
  }, { passive: true });
}

/* ───────────────────────────── loop ───────────────────────────── */

function tick(now) {
  const rawDt = (now - lastFrame) / 1000;
  const dt = clamp(rawDt, 0, 0.05);
  // easing usa tempo real (limitado a 0,5 s) — imune a quedas de fps
  const ease = clamp(rawDt, 0, 0.5);
  lastFrame = now;
  if (!document.hidden) {
    elapsed += dt;

    // fps
    fpsAcc += Math.max(rawDt, 0.0001);
    fpsCount++;
    if (fpsAcc > 0.5) {
      fps = fpsCount / fpsAcc;
      fpsAcc = 0;
      fpsCount = 0;
    }

    // retorno elástico do arrasto
    if (!dragging && (Math.abs(drag.yaw) > 0.001 || Math.abs(drag.pitch) > 0.001)) {
      const k = Math.exp(-ease * 2.2);
      drag.yaw *= k;
      drag.pitch *= k;
      world?.setDrag(drag.yaw, drag.pitch);
    }

    if (world) world.update(dt, ease);
    updateChapterDOM(ease);

    if (world && post) {
      post.update(ease, elapsed, world.glitchAmount * 0.35 + (chaos ? 0.4 : 0) + Math.abs(drag.yaw) * 0.3);
      post.render(dt);
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

  if (build()) {
    world.setChapter(0);
    post.setBloom(CHAPTERS[0].bloom);
    drone.setChapter(0);
    onScroll();
  }

  requestAnimationFrame((t) => {
    lastFrame = t;
    requestAnimationFrame(tick);
  });

  // pista de que existe algo abaixo
  setTimeout(() => {
    const hint = $('.ch-hint');
    if (hint) hint.style.opacity = '1';
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
