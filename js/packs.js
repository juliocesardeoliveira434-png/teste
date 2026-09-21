/* ============================================================
   TECLATON — 8 universos sonoros × 36 teclas = 288 sons
   Cada pack define: som (Web Audio) + visual (forma/cor)
   ============================================================ */
(function () {
  'use strict';

  function K(snd, vis) { return { snd: snd, vis: vis }; }
  function V(s, h) { return { s: s, h: h }; }

  // escalas (semitons a partir da tônica)
  var MAJ_PENT = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  var MIN_PENT = [0, 3, 5, 7, 10, 12, 15, 17, 19];
  var MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14];
  var MINOR = [0, 2, 3, 5, 7, 8, 10, 12, 14];
  var WHOLE = [0, 2, 4, 6, 8, 10, 12, 14, 16];

  var AI = 'abcdefghi'.split('');
  var JR = 'jklmnopqr'.split('');
  var SZ = 'stuvwxyz'.split('');
  var DG = '1234567890'.split('');

  // gera o bloco melódico a–i
  function mel(root, scale, mk, shapes, hue0, step) {
    var o = {};
    AI.forEach(function (L, i) {
      o[L] = K(mk(root + scale[i]), V(shapes[i % shapes.length], hue0 + i * (step || 9)));
    });
    return o;
  }
  // gera um bloco a partir de uma lista de specs
  function block(letters, list, shapes, hue0, step) {
    var o = {};
    letters.forEach(function (L, i) {
      var e = list[i % list.length];
      o[L] = K(e.snd, e.vis || V(shapes[i % shapes.length], (e.h != null ? e.h : hue0) + i * (step || 8)));
    });
    return o;
  }
  function S(t, p) { var o = p || {}; o.t = t; return o; }

  var PACKS = [

    /* ================= 1. CLÁSSICO ================= */
    {
      id: 'classico', nome: 'Clássico', emoji: '🎹',
      bg: ['#0a1c3a', '#1a4a86'], accent: '#ffd166',
      demo: [['e', 0], ['j', 300], ['a', 0], ['k', 300], ['g', 0], ['l', 300], ['c', 0], ['j', 300], ['h', 0], ['k', 300], ['i', 0], ['m', 420]],
      keys: Object.assign(
        mel(60, MAJ_PENT, function (m) { return S('marimba', { m: m, v: 0.25 }); },
          ['ring', 'disc', 'square', 'tri', 'diamond', 'circle'], 205, 8),
        block(JR, [
          { snd: S('kick', { f: 150, drop: 45 }) },
          { snd: S('hat', {}) },
          { snd: S('clap', {}) },
          { snd: S('tom', { m: 52 }) },
          { snd: S('snare', {}) },
          { snd: S('rim', {}) },
          { snd: S('hatO', {}) },
          { snd: S('tom', { m: 64 }) },
          { snd: S('stick', {}) }
        ], ['burst', 'ripple', 'grid', 'cross', 'bars', 'ring', 'zig', 'orbit', 'arrow'], 30, 6),
        block(SZ, [
          { snd: S('bell', { m: 72 }), vis: V('star', 50) },
          { snd: S('glock', { m: 79 }), vis: V('petal', 60) },
          { snd: S('chime', { m: 84 }), vis: V('spiral', 45) },
          { snd: S('pad', { ms: [60, 64, 67], w: 'triangle', cut: 1500, d: 1.6 }), vis: V('wave', 210) },
          { snd: S('arp', { ms: [60, 64, 67, 72], w: 'triangle', step: 0.09 }), vis: V('grid', 190) },
          { snd: S('swish', {}), vis: V('beam', 220) },
          { snd: S('vinyl', {}), vis: V('zig', 20) },
          { snd: S('organ', { m: 67, d: 0.6 }), vis: V('bars', 195) }
        ], ['star'], 50, 10),
        block(DG, [
          { snd: S('gliss', { m: 60, n: 10, dir: 1 }), vis: V('spiral', 55) },
          { snd: S('gliss', { m: 84, n: 10, dir: -1 }), vis: V('spiral', 205) },
          { snd: S('crash', { v: 0.3 }), vis: V('burst', 48) },
          { snd: S('gong', { f: 66 }), vis: V('ripple', 35) },
          { snd: S('boom', {}), vis: V('disc', 15) },
          { snd: S('roll', {}), vis: V('bars', 25) },
          { snd: S('pad', { ms: [60, 64, 67, 72], w: 'triangle', d: 2 }), vis: V('wave', 210) },
          { snd: S('arp', { ms: [60, 62, 64, 67, 69, 72, 74, 76], w: 'triangle', step: 0.08 }), vis: V('zig', 185) },
          { snd: S('bell', { m: 79, ratio: 3.1 }), vis: V('star', 65) },
          { snd: S('organ', { m: 60, d: 1 }), vis: V('bars', 200) }
        ], ['spiral'], 45, 10)
      )
    },

    /* ================= 2. LO-FI CHILL ================= */
    {
      id: 'lofi', nome: 'Lo-Fi Chill', emoji: '🌙',
      bg: ['#1c112e', '#452760'], accent: '#f2a65a',
      demo: [['f', 0], ['j', 350], ['e', 0], ['k', 350], ['c', 0], ['j', 350], ['g', 0], ['k', 350], ['a', 0], ['m', 350], ['d', 0], ['n', 480]],
      keys: Object.assign(
        mel(62, MIN_PENT, function (m) { return S('kalimba', { m: m, v: 0.3 }); },
          ['disc', 'ring', 'circle', 'petal', 'ripple'], 285, -7),
        block(JR, [
          { snd: S('kick808', {}) },
          { snd: S('snareG', {}) },
          { snd: S('hat', { d: 0.04, g: 0.22 }) },
          { snd: S('sub', { m: 38, d: 0.4 }) },
          { snd: S('clap808', {}) },
          { snd: S('vinyl', {}) },
          { snd: S('swish', { d: 0.3, g: 0.14 }) },
          { snd: S('tom', { m: 45, d: 0.35 }) },
          { snd: S('hatO', { g: 0.18 }) }
        ], ['ripple', 'disc', 'grid', 'disc', 'ring', 'zig', 'wave', 'orbit', 'burst'], 25, 7),
        block(SZ, [
          { snd: S('pad', { ms: [62, 65, 69, 72], w: 'triangle', cut: 1100, d: 2 }), vis: V('wave', 280) },
          { snd: S('pad', { ms: [65, 69, 72, 76], w: 'triangle', cut: 1200, d: 2 }), vis: V('wave', 300) },
          { snd: S('rain', {}), vis: V('grid', 200) },
          { snd: S('drop', { f: 700 }), vis: V('disc', 190) },
          { snd: S('bass', { m: 38, w: 'triangle', cut: 500, d: 0.5 }), vis: V('bars', 20) },
          { snd: S('bell', { m: 67, ratio: 2.8, idx: 4, d: 1.6 }), vis: V('star', 45) },
          { snd: S('chime', { m: 74, d: 2 }), vis: V('spiral', 60) },
          { snd: S('organ', { m: 62, d: 0.8 }), vis: V('bars', 265) }
        ], ['wave'], 290, -8),
        block(DG, [
          { snd: S('pad', { ms: [62, 65, 69, 72, 76], w: 'triangle', cut: 1000, d: 2.4 }), vis: V('wave', 275) },
          { snd: S('rain', {}), vis: V('grid', 205) },
          { snd: S('thunder', { v: 0.4 }), vis: V('bolt', 220) },
          { snd: S('bird', {}), vis: V('petal', 90) },
          { snd: S('boom', { f: 44, d: 1.3 }), vis: V('disc', 10) },
          { snd: S('arp', { ms: [62, 65, 69, 72], w: 'triangle', step: 0.11, cut: 2000 }), vis: V('zig', 295) },
          { snd: S('choir', { m: 62, d: 2, v: 0.4 }), vis: V('ripple', 310) },
          { snd: S('gliss', { m: 62, n: 9, dir: 1, scale: [0, 3, 5, 7, 10, 12, 15, 17, 19, 22] }), vis: V('spiral', 300) },
          { snd: S('chime', { m: 81, d: 2.2 }), vis: V('star', 70) },
          { snd: S('wind', { d: 2 }), vis: V('beam', 195) }
        ], ['spiral'], 300, -8)
      )
    },

    /* ================= 3. SYNTHWAVE ================= */
    {
      id: 'synth', nome: 'Synthwave', emoji: '🌆',
      bg: ['#170a30', '#3f1268'], accent: '#ff4fd8',
      demo: [['e', 0], ['j', 250], ['a', 0], ['k', 250], ['c', 0], ['l', 250], ['e', 0], ['m', 250], ['g', 0], ['k', 250], ['b', 0], ['n', 380]],
      keys: Object.assign(
        mel(57, MINOR, function (m) { return S('lead', { m: m, w: 'sawtooth', vib: 1, d: 0.32, g: 0.2 }); },
          ['square', 'bars', 'diamond', 'grid', 'beam'], 305, 7),
        block(JR, [
          { snd: S('kick', { f: 140, drop: 40, d: 0.3 }) },
          { snd: S('snareG', { v: 0.3 }) },
          { snd: S('hat', { g: 0.26 }) },
          { snd: S('tom', { m: 55, d: 0.25 }) },
          { snd: S('clap808', { v: 0.35 }) },
          { snd: S('rim', {}) },
          { snd: S('hatO', {}) },
          { snd: S('sub', { m: 36, d: 0.35 }) },
          { snd: S('cymbal', { v: 0.25 }) }
        ], ['burst', 'cross', 'grid', 'ripple', 'bars', 'orbit', 'zig', 'disc', 'arrow'], 260, 10),
        block(SZ, [
          { snd: S('bass', { m: 33, w: 'sawtooth', cut: 600, d: 0.35 }), vis: V('bars', 280) },
          { snd: S('arp', { ms: [57, 60, 64, 69], w: 'sawtooth', step: 0.075, cut: 2800 }), vis: V('zig', 320) },
          { snd: S('robot', { m: 90, rm: 30 }), vis: V('grid', 200) },
          { snd: S('laser', { f: 1800, to: 160 }), vis: V('bolt', 330) },
          { snd: S('sweep', { up: true }), vis: V('beam', 290) },
          { snd: S('riser', { d: 1.2 }), vis: V('spiral', 310) },
          { snd: S('warp', {}), vis: V('wave', 270) },
          { snd: S('ufo', {}), vis: V('orbit', 180) }
        ], ['beam'], 300, 9),
        block(DG, [
          { snd: S('pad', { ms: [57, 60, 64], w: 'sawtooth', cut: 1500, d: 1.8, v: 0.45 }), vis: V('wave', 300) },
          { snd: S('pad', { ms: [53, 57, 60], w: 'sawtooth', cut: 1400, d: 1.8, v: 0.45 }), vis: V('wave', 285) },
          { snd: S('pad', { ms: [55, 59, 62], w: 'sawtooth', cut: 1500, d: 1.8, v: 0.45 }), vis: V('wave', 320) },
          { snd: S('zap', {}), vis: V('bolt', 340) },
          { snd: S('boom', { f: 40 }), vis: V('disc', 260) },
          { snd: S('teleport', {}), vis: V('spiral', 190) },
          { snd: S('glitch', {}), vis: V('grid', 0) },
          { snd: S('crash', { v: 0.35 }), vis: V('burst', 305) },
          { snd: S('static', {}), vis: V('cross', 210) },
          { snd: S('cymbal', { v: 0.3 }), vis: V('ripple', 315) }
        ], ['spiral'], 310, 9)
      )
    },

    /* ================= 4. 8-BIT ================= */
    {
      id: 'chip', nome: '8-Bit', emoji: '🕹️',
      bg: ['#062419', '#0e5c3c'], accent: '#7dff5e',
      demo: [['d', 0], ['j', 220], ['b', 0], ['k', 220], ['f', 0], ['l', 220], ['h', 0], ['m', 220], ['e', 0], ['n', 220], ['g', 0], ['p', 340]],
      keys: Object.assign(
        mel(60, MAJOR, function (m) { return S('blip', { m: m, w: 'square', d: 0.1, g: 0.22 }); },
          ['square', 'grid', 'diamond', 'arrow', 'cross'], 110, 12),
        block(JR, [
          { snd: S('kick', { f: 220, drop: 60, d: 0.14, g: 0.9 }) },
          { snd: S('snare', { n: 2400, d: 0.08, g: 0.5, t: 260 }) },
          { snd: S('hat', { d: 0.03, g: 0.2 }) },
          { snd: S('jump', { f: 160, to: 560 }) },
          { snd: S('rim', {}) },
          { snd: S('wood', { f: 1500 }) },
          { snd: S('tom', { m: 67, d: 0.15 }) },
          { snd: S('stick', { f: 3600 }) },
          { snd: S('laser', { f: 1400, to: 220, d: 0.12, w: 'square' }) }
        ], ['square', 'burst', 'bars', 'arrow', 'grid', 'diamond', 'zig', 'cross', 'bolt'], 95, 14),
        block(SZ, [
          { snd: S('powerup', {}), vis: V('arrow', 110) },
          { snd: S('powerdown', {}), vis: V('arrow', 20) },
          { snd: S('glitch', {}), vis: V('grid', 0) },
          { snd: S('static', {}), vis: V('cross', 130) },
          { snd: S('blip', { m: 93, w: 'triangle', d: 0.14 }), vis: V('diamond', 150) },
          { snd: S('arp', { ms: [60, 64, 67, 72], w: 'square', step: 0.055, d: 0.08 }), vis: V('zig', 100) },
          { snd: S('bass', { m: 36, w: 'square', cut: 800, d: 0.2 }), vis: V('bars', 80) },
          { snd: S('robot', { m: 110, rm: 55 }), vis: V('grid', 160) }
        ], ['square'], 120, 12),
        block(DG, [
          { snd: S('powerup', { ms: [60, 64, 67, 72, 76, 79, 84] }), vis: V('arrow', 115) },
          { snd: S('powerdown', { ms: [84, 79, 76, 72, 67, 64, 60] }), vis: V('arrow', 25) },
          { snd: S('coin', {}), vis: V('circle', 48) },
          { snd: S('jump', { f: 200, to: 900 }), vis: V('arrow', 135) },
          { snd: S('boom', { f: 60, d: 0.7 }), vis: V('burst', 0) },
          { snd: S('glitch', {}), vis: V('grid', 15) },
          { snd: S('arp', { ms: [60, 62, 64, 67, 69, 72, 74, 76, 79], w: 'square', step: 0.06, d: 0.09 }), vis: V('zig', 105) },
          { snd: S('arp', { ms: [79, 76, 72, 69, 67, 64, 62, 60], w: 'square', step: 0.06, d: 0.09 }), vis: V('zig', 20) },
          { snd: S('static', {}), vis: V('cross', 140) },
          { snd: S('laser', { f: 3000, to: 80, d: 0.5, w: 'square' }), vis: V('bolt', 90) }
        ], ['arrow'], 110, 12)
      )
    },

    /* ================= 5. NATUREZA ================= */
    {
      id: 'natureza', nome: 'Natureza', emoji: '🌿',
      bg: ['#08240f', '#135c2e'], accent: '#a4e786',
      demo: [['a', 0], ['u', 250], ['c', 0], ['k', 250], ['e', 0], ['m', 250], ['g', 0], ['n', 250], ['i', 0], ['v', 380]],
      keys: Object.assign(
        block(AI, [520, 600, 700, 820, 950, 1100, 1300, 1500, 1750].map(function (f, i) {
          return { snd: S('drop', { f: f, v: 0.3 }), vis: V('disc', 130 + i * 8) };
        }), ['disc'], 130, 8),
        block(JR, [
          { snd: S('bird', {}), vis: V('petal', 95) },
          { snd: S('cricket', {}), vis: V('grid', 75) },
          { snd: S('bubble', { f: 200 }), vis: V('ring', 175) },
          { snd: S('bubble', { f: 300 }), vis: V('ring', 160) },
          { snd: S('splash', {}), vis: V('burst', 190) },
          { snd: S('wind', {}), vis: V('wave', 100) },
          { snd: S('rain', {}), vis: V('grid', 145) },
          { snd: S('swish', { d: 0.35 }), vis: V('beam', 120) },
          { snd: S('wood', { f: 900, v: 0.15 }), vis: V('cross', 40) }
        ], ['disc'], 130, 10),
        block(SZ, [
          { snd: S('thunder', {}), vis: V('bolt', 55) },
          { snd: S('wind', { d: 2.1 }), vis: V('wave', 105) },
          { snd: S('bird', {}), vis: V('petal', 85) },
          { snd: S('cricket', { d: 0.95 }), vis: V('grid', 70) },
          { snd: S('splash', {}), vis: V('burst', 185) },
          { snd: S('drop', { f: 300, v: 0.35 }), vis: V('disc', 155) },
          { snd: S('bubble', { f: 120, v: 0.35 }), vis: V('ring', 168) },
          { snd: S('swish', { d: 0.45, g: 0.16 }), vis: V('beam', 115) }
        ], ['bolt'], 60, 10),
        block(DG, [
          { snd: S('rain', {}), vis: V('grid', 140) },
          { snd: S('thunder', { v: 0.6 }), vis: V('bolt', 50) },
          { snd: S('bird', {}), vis: V('petal', 90) },
          { snd: S('wind', { d: 2.4 }), vis: V('wave', 100) },
          { snd: S('boom', { f: 38, d: 1.6, v: 0.5 }), vis: V('disc', 30) },
          { snd: S('splash', {}), vis: V('burst', 180) },
          { snd: S('cricket', { d: 1.3 }), vis: V('grid', 72) },
          { snd: S('bubble', { f: 90, v: 0.4 }), vis: V('ring', 165) },
          { snd: S('drop', { f: 2100, v: 0.22 }), vis: V('disc', 175) },
          { snd: S('boom', { f: 30, d: 2.2, v: 0.45 }), vis: V('ripple', 40) }
        ], ['bolt'], 55, 10)
      )
    },

    /* ================= 6. MUNDO ================= */
    {
      id: 'mundo', nome: 'Mundo', emoji: '🥁',
      bg: ['#2b0e08', '#7c2f10'], accent: '#ffb347',
      demo: [['a', 0], ['k', 220], ['c', 0], ['l', 220], ['e', 0], ['m', 220], ['g', 0], ['n', 220], ['i', 0], ['o', 220], ['s', 0], ['u', 400]],
      keys: Object.assign(
        block(AI, [150, 170, 190, 210, 235, 265, 300, 340, 380].map(function (f, i) {
          return { snd: S('conga', { f: f }), vis: V('disc', 18 + i * 7) };
        }), ['disc'], 18, 7),
        block(JR, [
          { snd: S('djembe', { f: 220 }), vis: V('burst', 30) },
          { snd: S('tabla', { f: 160 }), vis: V('ring', 15) },
          { snd: S('shaker', {}), vis: V('grid', 50) },
          { snd: S('agogo', {}), vis: V('diamond', 40) },
          { snd: S('cowbell', {}), vis: V('square', 35) },
          { snd: S('wood', { f: 1300 }), vis: V('cross', 55) },
          { snd: S('tamb', {}), vis: V('burst', 45) },
          { snd: S('stick', { f: 2000 }), vis: V('zig', 60) },
          { snd: S('tom', { m: 47, d: 0.4 }), vis: V('disc', 10) }
        ], ['disc'], 25, 8),
        block(SZ, [
          { snd: S('berimbau', { f: 180 }), vis: V('beam', 48) },
          { snd: S('berimbau', { f: 240 }), vis: V('beam', 40) },
          { snd: S('whistle', { f: 2100 }), vis: V('spiral', 100) },
          { snd: S('whistle', { f: 2600, to: 3300 }), vis: V('spiral', 90) },
          { snd: S('clap', {}), vis: V('burst', 20) },
          { snd: S('rim', {}), vis: V('cross', 30) },
          { snd: S('kick', { f: 90, drop: 52, d: 0.42 }), vis: V('disc', 8) },
          { snd: S('kalimba', { m: 76, v: 0.3 }), vis: V('petal', 70) }
        ], ['beam'], 45, 10),
        block(DG, [
          { snd: S('roll', {}), vis: V('bars', 25) },
          { snd: S('clap', {}), vis: V('burst', 22) },
          { snd: S('conga', { f: 150, d: 0.3 }), vis: V('disc', 15) },
          { snd: S('agogo', {}), vis: V('diamond', 42) },
          { snd: S('boom', { f: 48, d: 1 }), vis: V('disc', 5) },
          { snd: S('djembe', { f: 300 }), vis: V('burst', 35) },
          { snd: S('tabla', { f: 130 }), vis: V('ring', 12) },
          { snd: S('whistle', { f: 2200, to: 3200, d: 0.7 }), vis: V('spiral', 105) },
          { snd: S('crash', { v: 0.2 }), vis: V('ripple', 50) },
          { snd: S('gong', { f: 80 }), vis: V('ripple', 30) }
        ], ['spiral'], 40, 10)
      )
    },

    /* ================= 7. CINEMA ================= */
    {
      id: 'cinema', nome: 'Cinema', emoji: '🎬',
      bg: ['#0c0f26', '#25306e'], accent: '#f5d76e',
      demo: [['a', 0], ['k', 420], ['c', 0], ['l', 420], ['f', 0], ['m', 420], ['i', 0], ['p', 420], ['u', 0], ['D0', 700]],
      keys: Object.assign(
        block(AI, [
          { snd: S('strings', { m: 57 }), vis: V('wave', 225) },
          { snd: S('pizz', { m: 64 }), vis: V('disc', 45) },
          { snd: S('strings', { m: 60 }), vis: V('wave', 230) },
          { snd: S('brass', { m: 53 }), vis: V('bars', 30) },
          { snd: S('pizz', { m: 67 }), vis: V('disc', 50) },
          { snd: S('strings', { m: 64 }), vis: V('wave', 235) },
          { snd: S('brass', { m: 57 }), vis: V('bars', 35) },
          { snd: S('pizz', { m: 72 }), vis: V('disc', 55) },
          { snd: S('strings', { m: 69 }), vis: V('wave', 240) }
        ], ['wave'], 225, 6),
        block(JR, [
          { snd: S('timpani', { f: 73 }), vis: V('disc', 15) },
          { snd: S('timpani', { f: 98, d: 0.9 }), vis: V('disc', 20) },
          { snd: S('crash', {}), vis: V('burst', 48) },
          { snd: S('gong', { f: 66 }), vis: V('ripple', 40) },
          { snd: S('roll', {}), vis: V('bars', 25) },
          { snd: S('cymbal', { v: 0.3 }), vis: V('ripple', 52) },
          { snd: S('tom', { m: 48, d: 0.5 }), vis: V('disc', 12) },
          { snd: S('boom', { f: 44, d: 1.4 }), vis: V('disc', 8) },
          { snd: S('stick', { f: 2800, v: 0.15 }), vis: V('cross', 60) }
        ], ['disc'], 15, 8),
        block(SZ, [
          { snd: S('choir', { m: 60 }), vis: V('ripple', 265) },
          { snd: S('choir', { m: 65 }), vis: V('ripple', 270) },
          { snd: S('gliss', { m: 60, n: 11, dir: 1, step: 0.045 }), vis: V('spiral', 50) },
          { snd: S('gliss', { m: 84, n: 11, dir: -1, step: 0.045 }), vis: V('spiral', 225) },
          { snd: S('bell', { m: 72, ratio: 3.03, idx: 7, d: 2.2, v: 0.5 }), vis: V('star', 48) },
          { snd: S('chime', { m: 79, d: 2.4 }), vis: V('petal', 55) },
          { snd: S('sub', { m: 40, d: 0.7 }), vis: V('disc', 5) },
          { snd: S('swish', { d: 0.4, g: 0.22 }), vis: V('beam', 210) }
        ], ['ripple'], 265, 8),
        block(DG, [
          { snd: S('pad', { ms: [57, 60, 64], w: 'sawtooth', cut: 1300, d: 2.2, v: 0.4 }), vis: V('wave', 220) },
          { snd: S('pad', { ms: [53, 57, 60], w: 'sawtooth', cut: 1200, d: 2.2, v: 0.4 }), vis: V('wave', 210) },
          { snd: S('pad', { ms: [60, 64, 67], w: 'triangle', cut: 1600, d: 2.2 }), vis: V('wave', 265) },
          { snd: S('gliss', { m: 60, n: 13, dir: 1, step: 0.04 }), vis: V('spiral', 55) },
          { snd: S('boom', { f: 36, d: 1.8, v: 0.6 }), vis: V('disc', 6) },
          { snd: S('gong', { f: 55 }), vis: V('ripple', 35) },
          { snd: S('crash', { v: 0.4 }), vis: V('burst', 50) },
          { snd: S('thunder', { v: 0.5 }), vis: V('bolt', 230) },
          { snd: S('timpani', { f: 65, d: 1.6 }), vis: V('disc', 10) },
          { snd: S('heartbeat', {}), vis: V('ripple', 0) }
        ], ['wave'], 215, 8)
      )
    },

    /* ================= 8. SCI-FI ================= */
    {
      id: 'scifi', nome: 'Sci-Fi', emoji: '🛸',
      bg: ['#020a12', '#0a3d4f'], accent: '#35f0ff',
      demo: [['g', 0], ['k', 260], ['c', 0], ['l', 260], ['a', 0], ['m', 260], ['e', 0], ['n', 260], ['i', 0], ['o', 260], ['h', 0], ['D3', 520]],
      keys: Object.assign(
        block(AI, [
          { snd: S('laser', { f: 2400, to: 300 }), vis: V('bolt', 185) },
          { snd: S('laser', { f: 1800, to: 200, w: 'sawtooth' }), vis: V('bolt', 170) },
          { snd: S('blip', { m: 81, w: 'triangle', d: 0.12 }), vis: V('diamond', 160) },
          { snd: S('laser', { f: 3200, to: 400, d: 0.12 }), vis: V('bolt', 195) },
          { snd: S('robot', { m: 90, rm: 38 }), vis: V('grid', 140) },
          { snd: S('zap', {}), vis: V('bolt', 205) },
          { snd: S('radar', {}), vis: V('ripple', 185) },
          { snd: S('teleport', {}), vis: V('spiral', 155) },
          { snd: S('blip', { m: 88, w: 'square', d: 0.09 }), vis: V('diamond', 175) }
        ], ['bolt'], 175, 8),
        block(JR, [
          { snd: S('glitch', {}), vis: V('grid', 0) },
          { snd: S('static', {}), vis: V('cross', 150) },
          { snd: S('ufo', {}), vis: V('orbit', 165) },
          { snd: S('sweep', { up: true }), vis: V('beam', 190) },
          { snd: S('sweep', { up: false }), vis: V('beam', 130) },
          { snd: S('riser', {}), vis: V('spiral', 200) },
          { snd: S('warp', {}), vis: V('wave', 210) },
          { snd: S('laser', { f: 900, to: 50, d: 0.5, w: 'sawtooth' }), vis: V('bolt', 120) },
          { snd: S('robot', { m: 130, rm: 60 }), vis: V('grid', 145) }
        ], ['grid'], 150, 9),
        block(SZ, [
          { snd: S('sub', { m: 41, d: 0.6 }), vis: V('disc', 220) },
          { snd: S('arp', { ms: [58, 60, 62, 66], w: 'sawtooth', step: 0.07, cut: 2600 }), vis: V('zig', 180) },
          { snd: S('bell', { m: 81, ratio: 3.1, idx: 6, d: 1.6 }), vis: V('star', 160) },
          { snd: S('boom', { f: 30, d: 1.6, v: 0.55 }), vis: V('disc', 230) },
          { snd: S('powerdown', { w: 'sawtooth' }), vis: V('arrow', 140) },
          { snd: S('lead', { m: 70, w: 'square', vib: 1, d: 0.35 }), vis: V('diamond', 190) },
          { snd: S('swish', { d: 0.35 }), vis: V('beam', 205) },
          { snd: S('wind', { d: 1.8 }), vis: V('wave', 170) }
        ], ['disc'], 215, 8),
        block(DG, [
          { snd: S('warp', { d: 1.6 }), vis: V('wave', 210) },
          { snd: S('teleport', {}), vis: V('spiral', 160) },
          { snd: S('ufo', { d: 1.4 }), vis: V('orbit', 168) },
          { snd: S('riser', { d: 1.6 }), vis: V('spiral', 200) },
          { snd: S('boom', { f: 28, d: 2, v: 0.6 }), vis: V('disc', 225) },
          { snd: S('glitch', {}), vis: V('grid', 5) },
          { snd: S('arp', { ms: [58, 60, 62, 64, 66, 68, 70, 72], w: 'sawtooth', step: 0.08, cut: 2800 }), vis: V('zig', 185) },
          { snd: S('zap', {}), vis: V('bolt', 208) },
          { snd: S('radar', {}), vis: V('ripple', 188) },
          { snd: S('gong', { f: 50, v: 0.6 }), vis: V('ripple', 235) }
        ], ['spiral'], 200, 8)
      )
    }
  ];

  window.PACKS = PACKS;
})();
