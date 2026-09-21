/* ============================================================
   TECLATON — motor de áudio (Web Audio API, 100% sintetizado)
   Nenhum arquivo de áudio, nenhuma API externa, nenhuma chave.
   ============================================================ */
(function () {
  'use strict';

  var A4 = 440;
  function mtof(m) { return A4 * Math.pow(2, (m - 69) / 12); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function Engine() {
    this.ctx = null;
    this.volume = 0.8;
    this.recDest = null;
  }

  /* ---------- infra ---------- */

  Engine.prototype.init = function () {
    if (this.ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var c;
    try { c = this.ctx = new AC({ latencyHint: 'interactive' }); }
    catch (e) { c = this.ctx = new AC(); }

    this.master = c.createGain();
    this.master.gain.value = this.volume;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.knee.value = 22;
    this.comp.ratio.value = 5;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.2;
    this.master.connect(this.comp);
    this.comp.connect(c.destination);

    // reverb global (impulso gerado proceduralmente)
    this.verbIn = c.createGain(); this.verbIn.gain.value = 0.9;
    this.verb = c.createConvolver();
    this.verb.buffer = this.makeIR(2.4, 2.4);
    this.verbLP = c.createBiquadFilter(); this.verbLP.type = 'lowpass'; this.verbLP.frequency.value = 5000;
    this.verbOut = c.createGain(); this.verbOut.gain.value = 0.85;
    this.verbIn.connect(this.verb);
    this.verb.connect(this.verbLP);
    this.verbLP.connect(this.verbOut);
    this.verbOut.connect(this.master);

    // delay global com feedback
    this.dlyIn = c.createGain(); this.dlyIn.gain.value = 0.9;
    this.dly = c.createDelay(2); this.dly.delayTime.value = 0.29;
    this.dlyFb = c.createGain(); this.dlyFb.gain.value = 0.36;
    this.dlyLP = c.createBiquadFilter(); this.dlyLP.type = 'lowpass'; this.dlyLP.frequency.value = 3600;
    this.dlyIn.connect(this.dly);
    this.dly.connect(this.dlyLP);
    this.dlyLP.connect(this.dlyFb);
    this.dlyFb.connect(this.dly);
    this.dlyLP.connect(this.master);

    // buffers de ruído
    this.white = this.makeNoise(2, function (i) { return Math.random() * 2 - 1; });
    var last = 0;
    this.brown = this.makeNoise(3, function () {
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      return last * 3.5;
    });
  };

  Engine.prototype.resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  Engine.prototype.now = function () {
    return this.ctx ? this.ctx.currentTime : 0;
  };

  Engine.prototype.setVolume = function (v) {
    this.volume = clamp(v, 0, 1);
    if (this.master) this.master.gain.setTargetAtTime(this.volume, this.now(), 0.02);
  };

  Engine.prototype.makeNoise = function (sec, gen) {
    var c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * sec);
    var buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = gen(i, sr);
    return buf;
  };

  Engine.prototype.makeIR = function (sec, decay) {
    var c = this.ctx, sr = c.sampleRate, n = Math.floor(sr * sec);
    var buf = c.createBuffer(2, n, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch), last = 0;
      for (var i = 0; i < n; i++) {
        var w = Math.random() * 2 - 1;
        last = (last + 0.03 * w) / 1.03;           // escurece o ruido
        d[i] = (w * 0.35 + last * 2.2) * Math.pow(1 - i / n, decay);
      }
    }
    return buf;
  };

  // nó de saída por hit, com envios p/ reverb e delay
  Engine.prototype.hit = function (t, verb, dly) {
    var c = this.ctx, g = c.createGain();
    g.gain.value = 1;
    g.connect(this.master);
    if (verb) { var s = c.createGain(); s.gain.value = verb; g.connect(s); s.connect(this.verbIn); }
    if (dly) { var s2 = c.createGain(); s2.gain.value = dly; g.connect(s2); s2.connect(this.dlyIn); }
    return g;
  };

  Engine.prototype.env = function (t, peak, a, d) {
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(0.001, a));
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + Math.max(0.01, d));
    return g;
  };

  Engine.prototype.osc = function (type, f, t) {
    var o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(1, f), t);
    return o;
  };

  Engine.prototype.noise = function (t, dur, buf) {
    var s = this.ctx.createBufferSource();
    s.buffer = buf || this.white;
    s.loop = true;
    s.start(t);
    s.stop(t + dur + 0.1);
    return s;
  };

  Engine.prototype.filt = function (type, f, q) {
    var b = this.ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = clamp(f, 20, 20000);
    b.Q.value = q || 1;
    return b;
  };

  function freqOf(p) { return p.f != null ? p.f : mtof(p.m || 60); }

  /* ---------- banco de sons ---------- */

  var BANK = {

    /* ===== bateria / percussão ===== */

    kick: function (E, t, p) {
      var o = E.osc('sine', p.f || 150, t);
      o.frequency.exponentialRampToValueAtTime(p.drop || 45, t + 0.09);
      var g = E.env(t, p.g || 1.0, 0.002, p.d || 0.26);
      o.connect(g); g.connect(E.hit(t, p.v || 0));
      o.start(t); o.stop(t + (p.d || 0.26) + 0.15);
      var n = E.noise(t, 0.015), hp = E.filt('highpass', 1500), ng = E.env(t, 0.25, 0.001, 0.02);
      n.connect(hp); hp.connect(ng); ng.connect(E.hit(t)); 
    },

    kick808: function (E, t, p) {
      var o = E.osc('sine', p.f || 130, t);
      o.frequency.exponentialRampToValueAtTime(p.drop || 38, t + 0.12);
      var g = E.env(t, 1.1, 0.003, p.d || 0.55);
      o.connect(g); g.connect(E.hit(t, p.v || 0.1));
      o.start(t); o.stop(t + (p.d || 0.55) + 0.2);
    },

    snare: function (E, t, p) {
      var n = E.noise(t, 0.25), bp = E.filt('bandpass', p.n || 1900, 0.9);
      var ng = E.env(t, p.g || 0.7, 0.002, p.d || 0.16);
      n.connect(bp); bp.connect(ng); ng.connect(E.hit(t, p.v || 0.15));
      var o = E.osc('triangle', p.t || 192, t), og = E.env(t, 0.5, 0.002, 0.09);
      o.connect(og); og.connect(E.hit(t)); o.start(t); o.stop(t + 0.2);
    },

    snareG: function (E, t, p) {
      var n = E.noise(t, 0.12), hp = E.filt('highpass', 350), bp = E.filt('bandpass', 1400, 0.7);
      var ng = E.env(t, 0.55, 0.001, 0.075);
      n.connect(hp); hp.connect(bp); bp.connect(ng); ng.connect(E.hit(t, p.v || 0.2));
      var o = E.osc('triangle', 175, t), og = E.env(t, 0.45, 0.002, 0.06);
      o.connect(og); og.connect(E.hit(t)); o.start(t); o.stop(t + 0.15);
    },

    hat: function (E, t, p) { metal(E, t, { d: p.d || 0.05, hp: 7500, g: p.g || 0.32 }); },
    hatO: function (E, t, p) { metal(E, t, { d: 0.32, hp: 6800, g: p.g || 0.26 }); },

    clap: function (E, t, p) {
      var out = E.hit(t, p.v || 0.25);
      for (var i = 0; i < 3; i++) {
        var tt = t + i * 0.013;
        var n = E.noise(tt, 0.05), bp = E.filt('bandpass', 1150, 1.8);
        var g = E.env(tt, 0.5, 0.001, 0.03);
        n.connect(bp); bp.connect(g); g.connect(out);
      }
      var n2 = E.noise(t + 0.03, 0.3), bp2 = E.filt('bandpass', 1200, 1.2);
      var g2 = E.env(t + 0.03, 0.4, 0.002, 0.16);
      n2.connect(bp2); bp2.connect(g2); g2.connect(out);
    },

    clap808: function (E, t, p) {
      var n = E.noise(t, 0.35), bp = E.filt('bandpass', 1500, 1.4);
      var g = E.env(t, 0.6, 0.001, 0.28);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, p.v || 0.3));
    },

    rim: function (E, t, p) {
      var o = E.osc('square', 820, t), bp = E.filt('bandpass', 1700, 4), g = E.env(t, 0.4, 0.001, 0.03);
      o.connect(bp); bp.connect(g); g.connect(E.hit(t)); o.start(t); o.stop(t + 0.08);
      var n = E.noise(t, 0.02), hp = E.filt('highpass', 4000), ng = E.env(t, 0.2, 0.001, 0.015);
      n.connect(hp); hp.connect(ng); ng.connect(E.hit(t));
    },

    stick: function (E, t, p) {
      var n = E.noise(t, 0.02), bp = E.filt('bandpass', p.f || 2400, 6), g = E.env(t, 0.5, 0.001, 0.018);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, p.v || 0.1));
    },

    tom: function (E, t, p) {
      var f = freqOf(p) || 150;
      var o = E.osc('sine', f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.28);
      var g = E.env(t, 0.85, 0.002, p.d || 0.3);
      o.connect(g); g.connect(E.hit(t, p.v || 0.12));
      o.start(t); o.stop(t + 0.55);
      var n = E.noise(t, 0.02), lp = E.filt('lowpass', 900), ng = E.env(t, 0.18, 0.001, 0.02);
      n.connect(lp); lp.connect(ng); ng.connect(E.hit(t));
    },

    timpani: function (E, t, p) {
      var f = freqOf(p) || 73;
      var o = E.osc('sine', f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.92, t + 0.25);
      var g = E.env(t, 0.9, 0.004, p.d || 1.2);
      o.connect(g); g.connect(E.hit(t, p.v || 0.55));
      o.start(t); o.stop(t + 1.6);
      var o2 = E.osc('sine', f * 1.5, t), g2 = E.env(t, 0.2, 0.004, 0.5);
      o2.connect(g2); g2.connect(E.hit(t)); o2.start(t); o2.stop(t + 0.7);
      var n = E.noise(t, 0.05), lp = E.filt('lowpass', 260), ng = E.env(t, 0.4, 0.001, 0.05);
      n.connect(lp); lp.connect(ng); ng.connect(E.hit(t));
    },

    conga: function (E, t, p) {
      var f = freqOf(p) || 170;
      var o = E.osc('sine', f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.62, t + 0.14);
      var g = E.env(t, 0.8, 0.002, p.d || 0.16);
      o.connect(g); g.connect(E.hit(t, p.v || 0.1));
      o.start(t); o.stop(t + 0.35);
      var o2 = E.osc('sine', f * 2.7, t), g2 = E.env(t, 0.12, 0.001, 0.05);
      o2.connect(g2); g2.connect(E.hit(t)); o2.start(t); o2.stop(t + 0.1);
    },

    djembe: function (E, t, p) {
      BANK.conga(E, t, { f: freqOf(p) || 200, d: 0.13, v: 0.1 });
      var n = E.noise(t, 0.03), bp = E.filt('bandpass', 2600, 1.5), g = E.env(t, 0.25, 0.001, 0.028);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t));
    },

    tabla: function (E, t, p) {
      var f = freqOf(p) || 150;
      var o = E.osc('sine', f, t);
      o.frequency.setValueAtTime(f * 1.3, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      var g = E.env(t, 0.7, 0.002, 0.28);
      o.connect(g); g.connect(E.hit(t, p.v || 0.2));
      o.start(t); o.stop(t + 0.4);
      var n = E.noise(t, 0.02), bp = E.filt('bandpass', 3200, 2), ng = E.env(t, 0.3, 0.001, 0.02);
      n.connect(bp); bp.connect(ng); ng.connect(E.hit(t));
    },

    cowbell: function (E, t, p) {
      var out = E.hit(t, p.v || 0.12), bp = E.filt('bandpass', 1900, 1.1);
      [560, 845].forEach(function (f) {
        var o = E.osc('square', f * (p.r || 1), t), g = E.env(t, 0.35, 0.002, p.d || 0.22);
        o.connect(g); g.connect(bp); o.start(t); o.stop(t + (p.d || 0.22) + 0.1);
      });
      bp.connect(out);
    },

    agogo: function (E, t, p) {
      BANK.cowbell(E, t, { r: 1.62, d: 0.12, v: p.v || 0.08 });
    },

    wood: function (E, t, p) {
      var f = p.f || 1150;
      var n = E.noise(t, 0.012), bp = E.filt('bandpass', f, 9), g = E.env(t, 0.6, 0.001, 0.012);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, p.v || 0.08));
      var o = E.osc('sine', f * 0.55, t), og = E.env(t, 0.3, 0.001, 0.03);
      o.connect(og); og.connect(E.hit(t)); o.start(t); o.stop(t + 0.08);
    },

    shaker: function (E, t, p) {
      var n = E.noise(t, 0.1), hp = E.filt('highpass', 6200);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(p.g || 0.3, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (p.d || 0.09));
      n.connect(hp); hp.connect(g); g.connect(E.hit(t, p.v || 0.06));
    },

    tamb: function (E, t, p) { metal(E, t, { d: 0.14, hp: 5500, g: 0.3 }); },

    cymbal: function (E, t, p) {
      metal(E, t, { d: 0.9, hp: 5200, g: 0.3, v: p.v || 0.2 });
      var n = E.noise(t, 1.0), hp = E.filt('highpass', 4500), g = E.env(t, 0.2, 0.003, 0.8);
      n.connect(hp); hp.connect(g); g.connect(E.hit(t, 0.15));
    },

    crash: function (E, t, p) {
      metal(E, t, { d: 1.7, hp: 3400, g: 0.4, oscs: 8 });
      var n = E.noise(t, 1.9), hp = E.filt('highpass', 3000), g = E.env(t, 0.3, 0.004, 1.6);
      n.connect(hp); hp.connect(g); g.connect(E.hit(t, p.v || 0.5));
    },

    gong: function (E, t, p) {
      var out = E.hit(t, p.v || 0.7), f0 = freqOf(p) || 66;
      [1, 1.53, 2.34, 3.19, 4.01, 5.03].forEach(function (r, i) {
        var o = E.osc('sine', f0 * r * rnd(0.99, 1.01), t);
        var g = E.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.5 / (i + 1), t + 0.02 + i * 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2 - i * 0.4);
        o.connect(g); g.connect(out);
        o.start(t); o.stop(t + 3.6);
      });
      var n = E.noise(t, 0.15), lp = E.filt('lowpass', 700), ng = E.env(t, 0.35, 0.002, 0.14);
      n.connect(lp); lp.connect(ng); ng.connect(out);
    },

    boom: function (E, t, p) {
      var o = E.osc('sine', p.f || 52, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.8);
      var g = E.env(t, 1.0, 0.005, p.d || 1.1);
      o.connect(g); g.connect(E.hit(t, p.v || 0.6));
      o.start(t); o.stop(t + 1.5);
      var n = E.noise(t, 0.4), lp = E.filt('lowpass', 220), ng = E.env(t, 0.5, 0.004, 0.35);
      n.connect(lp); lp.connect(ng); ng.connect(E.hit(t, 0.5));
    },

    roll: function (E, t, p) {
      for (var i = 0; i < 9; i++) {
        var tt = t + i * (0.085 - i * 0.006);
        var n = E.noise(tt, 0.08), bp = E.filt('bandpass', 1800, 1), g = E.env(tt, 0.3 + i * 0.04, 0.001, 0.05);
        n.connect(bp); bp.connect(g); g.connect(E.hit(t, 0.2));
      }
    },

    heartbeat: function (E, t, p) {
      [0, 0.24].forEach(function (off, i) {
        var o = E.osc('sine', 58, t + off);
        o.frequency.exponentialRampToValueAtTime(38, t + off + 0.1);
        var g = E.env(t + off, i ? 0.7 : 0.9, 0.004, 0.14);
        o.connect(g); g.connect(E.hit(t));
        o.start(t + off); o.stop(t + off + 0.3);
      });
    },

    /* ===== melódicos ===== */

    pluck: function (E, t, p) {
      var f = freqOf(p);
      var o = E.osc(p.w || 'triangle', f, t);
      var lp = E.filt('lowpass', (p.cut || 2600), 1);
      lp.frequency.setValueAtTime((p.cut || 2600) * 2, t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(120, (p.cut || 2600) * 0.35), t + 0.25);
      var g = E.env(t, p.g || 0.5, 0.004, p.d || 0.4);
      o.connect(lp); lp.connect(g); g.connect(E.hit(t, p.v || 0.25));
      o.start(t); o.stop(t + (p.d || 0.4) + 0.2);
    },

    marimba: function (E, t, p) {
      var f = freqOf(p), out = E.hit(t, p.v || 0.25);
      var o = E.osc('sine', f, t), g = E.env(t, 0.55, 0.003, p.d || 0.45);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + (p.d || 0.45) + 0.2);
      var o2 = E.osc('sine', f * 4.01, t), g2 = E.env(t, 0.1, 0.002, 0.07);
      o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.15);
    },

    kalimba: function (E, t, p) {
      var f = freqOf(p), out = E.hit(t, p.v || 0.3);
      var o = E.osc('triangle', f, t), g = E.env(t, 0.45, 0.003, p.d || 0.55);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.9);
      var o2 = E.osc('sine', f * 2.02, t), g2 = E.env(t, 0.12, 0.002, 0.12);
      o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.2);
    },

    bell: function (E, t, p) {
      var f = freqOf(p), ratio = p.ratio || 2.42, idx = p.idx || 5, d = p.d || 1.4;
      var car = E.osc('sine', f, t);
      var mod = E.osc('sine', f * ratio, t);
      var mg = E.ctx.createGain();
      mg.gain.setValueAtTime(f * idx, t);
      mg.gain.exponentialRampToValueAtTime(f * 0.02, t + d * 0.55);
      mod.connect(mg); mg.connect(car.frequency);
      var g = E.env(t, p.g || 0.4, 0.003, d);
      car.connect(g); g.connect(E.hit(t, p.v || 0.45));
      car.start(t); car.stop(t + d + 0.3);
      mod.start(t); mod.stop(t + d + 0.3);
    },

    glock: function (E, t, p) {
      var f = freqOf(p), out = E.hit(t, p.v || 0.35);
      var o = E.osc('sine', f, t), g = E.env(t, 0.45, 0.002, p.d || 0.8);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.1);
      var o2 = E.osc('sine', f * 3.02, t), g2 = E.env(t, 0.1, 0.002, 0.2);
      o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.3);
    },

    chime: function (E, t, p) {
      BANK.bell(E, t, { f: freqOf(p) * 2, ratio: 3.53, idx: 7, d: p.d || 1.8, g: 0.3, v: 0.5 });
    },

    bass: function (E, t, p) {
      var f = freqOf(p);
      var o = E.osc(p.w || 'sawtooth', f, t);
      var lp = E.filt('lowpass', p.cut || 650, 1.1);
      lp.frequency.setValueAtTime((p.cut || 650) * 2.2, t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(80, p.cut || 650), t + 0.12);
      var g = E.env(t, p.g || 0.55, 0.004, p.d || 0.32);
      o.connect(lp); lp.connect(g); g.connect(E.hit(t));
      o.start(t); o.stop(t + (p.d || 0.32) + 0.15);
    },

    sub: function (E, t, p) {
      var f = freqOf(p) || 46;
      var o = E.osc('sine', f, t), g = E.env(t, 0.9, 0.005, p.d || 0.5);
      o.connect(g); g.connect(E.hit(t));
      o.start(t); o.stop(t + 0.8);
      var o2 = E.osc('square', f, t), lp = E.filt('lowpass', 300), g2 = E.env(t, 0.12, 0.005, p.d || 0.5);
      o2.connect(lp); lp.connect(g2); g2.connect(E.hit(t));
      o2.start(t); o2.stop(t + 0.8);
    },

    lead: function (E, t, p) {
      var f = freqOf(p), out = E.hit(t, p.v || 0.18);
      var lp = E.filt('lowpass', p.cut || 3600, 0.8);
      lp.connect(out);
      [0, 7].forEach(function (cents) {
        var o = E.osc(p.w || 'square', f, t);
        o.detune.value = cents - 3.5;
        if (p.vib) {
          var lfo = E.osc('sine', 5.4, t), lg = E.ctx.createGain();
          lg.gain.setValueAtTime(0, t);
          lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.12);
          lfo.connect(lg); lg.connect(o.frequency);
          lfo.start(t); lfo.stop(t + (p.d || 0.3) + 0.2);
        }
        var g = E.env(t, p.g || 0.24, 0.006, p.d || 0.3);
        o.connect(g); g.connect(lp);
        o.start(t); o.stop(t + (p.d || 0.3) + 0.2);
      });
    },

    organ: function (E, t, p) {
      var f = freqOf(p), out = E.hit(t, p.v || 0.2), d = p.d || 0.55;
      [1, 2, 3, 4].forEach(function (h, i) {
        var o = E.osc('sine', f * h, t);
        var g = E.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.28 / (i * 0.6 + 1), t + 0.025);
        g.gain.setValueAtTime(0.28 / (i * 0.6 + 1), t + d * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(out);
        o.start(t); o.stop(t + d + 0.1);
      });
    },

    pad: function (E, t, p) {
      var ms = p.ms || [60, 64, 67], d = p.d || 1.6, out = E.hit(t, p.v != null ? p.v : 0.5);
      var lp = E.filt('lowpass', p.cut || 1600, 0.6);
      lp.connect(out);
      lp.frequency.setValueAtTime((p.cut || 1600) * 0.5, t);
      lp.frequency.linearRampToValueAtTime(p.cut || 1600, t + d * 0.4);
      ms.forEach(function (m) {
        [-7, 7].forEach(function (cents) {
          var o = E.osc(p.w || 'sawtooth', mtof(m), t);
          o.detune.value = cents;
          var g = E.ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.07, t + d * 0.3);
          g.gain.setValueAtTime(0.07, t + d * 0.6);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(g); g.connect(lp);
          o.start(t); o.stop(t + d + 0.2);
        });
      });
    },

    strings: function (E, t, p) {
      var f = freqOf(p), d = p.d || 1.6, out = E.hit(t, p.v != null ? p.v : 0.5);
      var lp = E.filt('lowpass', 2300, 0.7);
      lp.connect(out);
      [-6, 0, 6].forEach(function (cents) {
        var o = E.osc('sawtooth', f, t);
        o.detune.value = cents;
        var lfo = E.osc('sine', 5.2, t), lg = E.ctx.createGain();
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(f * 0.008, t + 0.5);
        lfo.connect(lg); lg.connect(o.frequency);
        lfo.start(t); lfo.stop(t + d + 0.3);
        var g = E.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.28);
        g.gain.setValueAtTime(0.09, t + d * 0.55);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(lp);
        o.start(t); o.stop(t + d + 0.3);
      });
    },

    brass: function (E, t, p) {
      var f = freqOf(p), d = p.d || 0.7, out = E.hit(t, p.v != null ? p.v : 0.3);
      var o = E.osc('sawtooth', f, t);
      var lp = E.filt('lowpass', 300, 1);
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(2600, t + 0.09);
      lp.frequency.exponentialRampToValueAtTime(900, t + d);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.34, t + 0.07);
      g.gain.setValueAtTime(0.3, t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(lp); lp.connect(g); g.connect(out);
      o.start(t); o.stop(t + d + 0.15);
    },

    choir: function (E, t, p) {
      var f = freqOf(p), d = p.d || 1.8, out = E.hit(t, p.v != null ? p.v : 0.55);
      var o = E.osc('sawtooth', f, t);
      var lfo = E.osc('sine', 4.6, t), lg = E.ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.01, t + 0.6);
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(t); lfo.stop(t + d + 0.3);
      var b1 = E.filt('bandpass', 720, 2.2), b2 = E.filt('bandpass', 1180, 2.6);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.4);
      g.gain.setValueAtTime(0.5, t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      var g1 = E.ctx.createGain(); g1.gain.value = 0.6;
      var g2 = E.ctx.createGain(); g2.gain.value = 0.4;
      o.connect(b1); b1.connect(g1); g1.connect(g);
      o.connect(b2); b2.connect(g2); g2.connect(g);
      g.connect(out);
      o.start(t); o.stop(t + d + 0.3);
    },

    pizz: function (E, t, p) {
      BANK.pluck(E, t, { m: p.m, w: 'sawtooth', cut: 1400, d: 0.14, g: 0.35, v: 0.25 });
    },

    gliss: function (E, t, p) {
      var base = p.m || 60, n = p.n || 9, dir = p.dir || 1, step = p.step || 0.05;
      var scale = p.scale || [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 19, 21, 24];
      for (var i = 0; i < n; i++) {
        var m = base + dir * scale[i];
        BANK.pluck(E, t + i * step, { m: m, w: 'triangle', cut: 3200, d: 0.3, g: 0.32, v: 0.35 });
      }
    },

    arp: function (E, t, p) {
      var ms = p.ms || [60, 64, 67, 72], step = p.step || 0.085, d = p.d || 0.14;
      var total = ms.length * step;
      ms.forEach(function (m, i) {
        var o = E.osc(p.w || 'square', mtof(m), t + i * step);
        var lp = E.filt('lowpass', p.cut || 3000, 1);
        var g = E.env(t + i * step, p.g || 0.22, 0.004, d);
        o.connect(lp); lp.connect(g); g.connect(E.hit(t, p.v || 0.25));
        o.start(t + i * step); o.stop(t + i * step + d + 0.1);
      });
      return total;
    },

    blip: function (E, t, p) {
      var f = freqOf(p);
      var o = E.osc(p.w || 'square', f, t);
      var g = E.env(t, p.g || 0.25, 0.003, p.d || 0.09);
      o.connect(g); g.connect(E.hit(t, p.v || 0.15));
      o.start(t); o.stop(t + (p.d || 0.09) + 0.08);
    },

    coin: function (E, t, p) {
      var w = p.w || 'square';
      var o = E.osc(w, mtof(83), t), g = E.env(t, 0.25, 0.002, 0.07);
      o.connect(g); g.connect(E.hit(t)); o.start(t); o.stop(t + 0.12);
      var o2 = E.osc(w, mtof(88), t + 0.075), g2 = E.env(t + 0.075, 0.25, 0.002, 0.3);
      o2.connect(g2); g2.connect(E.hit(t, 0.15)); o2.start(t + 0.075); o2.stop(t + 0.5);
    },

    powerup: function (E, t, p) {
      var ms = p.ms || [72, 76, 79, 84, 88];
      BANK.arp(E, t, { ms: ms, step: 0.06, w: p.w || 'square', d: 0.09, g: 0.22, v: 0.15 });
    },

    powerdown: function (E, t, p) {
      var ms = p.ms || [84, 79, 76, 72, 67];
      BANK.arp(E, t, { ms: ms, step: 0.06, w: p.w || 'square', d: 0.09, g: 0.22, v: 0.1 });
    },

    jump: function (E, t, p) {
      var o = E.osc('square', p.f || 160, t);
      o.frequency.exponentialRampToValueAtTime(p.to || 560, t + 0.14);
      var g = E.env(t, 0.22, 0.003, 0.16);
      o.connect(g); g.connect(E.hit(t)); o.start(t); o.stop(t + 0.25);
    },

    berimbau: function (E, t, p) {
      var f = freqOf(p) || 180;
      var o = E.osc('sawtooth', f * 1.18, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.13);
      var bp = E.filt('bandpass', f * 2.2, 5);
      bp.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.2);
      var g = E.env(t, 0.5, 0.003, p.d || 0.45);
      o.connect(bp); bp.connect(g); g.connect(E.hit(t, p.v || 0.3));
      o.start(t); o.stop(t + 0.6);
      var n = E.noise(t, 0.05), bp2 = E.filt('bandpass', 3000, 2), ng = E.env(t, 0.15, 0.001, 0.05);
      n.connect(bp2); bp2.connect(ng); ng.connect(E.hit(t));
    },

    whistle: function (E, t, p) {
      var f = freqOf(p) || 2200;
      var o = E.osc('sine', f, t);
      var lfo = E.osc('sine', 6, t), lg = E.ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.03, t + 0.15);
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(t); lfo.stop(t + 0.7);
      if (p.to) { o.frequency.exponentialRampToValueAtTime(p.to, t + 0.35); }
      var g = E.env(t, 0.22, 0.03, p.d || 0.5);
      o.connect(g); g.connect(E.hit(t, p.v || 0.35));
      o.start(t); o.stop(t + 0.8);
    },

    /* ===== texturas / efeitos ===== */

    laser: function (E, t, p) {
      var o = E.osc(p.w || 'square', p.f || 1900, t);
      o.frequency.exponentialRampToValueAtTime(p.to || 180, t + (p.d || 0.2));
      var g = E.env(t, 0.28, 0.002, p.d || 0.2);
      o.connect(g); g.connect(E.hit(t, 0, 0.12));
      o.start(t); o.stop(t + (p.d || 0.2) + 0.1);
    },

    zap: function (E, t, p) {
      var o = E.osc('sawtooth', 2800, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.32);
      var g = E.env(t, 0.3, 0.002, 0.3);
      o.connect(g); g.connect(E.hit(t, 0.1, 0.15));
      o.start(t); o.stop(t + 0.45);
    },

    radar: function (E, t, p) {
      var o = E.osc('sine', p.f || 1180, t);
      var g = E.env(t, 0.3, 0.004, p.d || 0.22);
      o.connect(g); g.connect(E.hit(t, 0.25, 0.55));
      o.start(t); o.stop(t + 0.35);
    },

    robot: function (E, t, p) {
      var o = E.osc('square', freqOf(p) || 110, t);
      var m = E.osc('square', p.rm || 34, t);
      var ring = E.ctx.createGain();
      ring.gain.value = 0;
      m.connect(ring.gain);
      var g = E.env(t, 0.3, 0.01, p.d || 0.4);
      o.connect(ring); ring.connect(g); g.connect(E.hit(t, 0.2, 0.2));
      o.start(t); o.stop(t + 0.55);
      m.start(t); m.stop(t + 0.55);
    },

    teleport: function (E, t, p) {
      var o = E.osc('sine', 380, t);
      o.frequency.exponentialRampToValueAtTime(1750, t + 0.4);
      var g = E.env(t, 0.2, 0.02, 0.42);
      o.connect(g); g.connect(E.hit(t, 0.35, 0.4));
      o.start(t); o.stop(t + 0.6);
      var n = E.noise(t, 0.4), hp = E.filt('highpass', 2500), ng = E.env(t, 0.12, 0.03, 0.35);
      n.connect(hp); hp.connect(ng); ng.connect(E.hit(t, 0.3, 0.3));
    },

    warp: function (E, t, p) {
      var out = E.hit(t, 0.5, 0.2), d = p.d || 1.3;
      [55, 55.7].forEach(function (f) {
        var o = E.osc('sawtooth', f, t);
        var lp = E.filt('lowpass', 200, 2);
        lp.frequency.setValueAtTime(180, t);
        lp.frequency.exponentialRampToValueAtTime(4200, t + d * 0.55);
        lp.frequency.exponentialRampToValueAtTime(240, t + d);
        var g = E.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.16, t + d * 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(lp); lp.connect(g); g.connect(out);
        o.start(t); o.stop(t + d + 0.2);
      });
    },

    ufo: function (E, t, p) {
      var o = E.osc('sine', 620, t);
      var lfo = E.osc('sine', 6.5, t), lg = E.ctx.createGain();
      lg.gain.value = 280;
      lfo.connect(lg); lg.connect(o.frequency);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (p.d || 0.95));
      o.connect(g); g.connect(E.hit(t, 0.3, 0.25));
      o.start(t); o.stop(t + 1.2);
      lfo.start(t); lfo.stop(t + 1.2);
    },

    sweep: function (E, t, p) {
      var up = p.up !== false, d = p.d || 0.65;
      var n = E.noise(t, d), bp = E.filt('bandpass', up ? 300 : 5600, 2.2);
      bp.frequency.exponentialRampToValueAtTime(up ? 5600 : 300, t + d);
      var g = E.env(t, p.g || 0.25, 0.02, d);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, p.v || 0.3));
    },

    wind: function (E, t, p) {
      var d = p.d || 1.4;
      var n = E.noise(t, d, E.brown), bp = E.filt('bandpass', 380, 0.6);
      var lfo = E.osc('sine', 0.5, t), lg = E.ctx.createGain();
      lg.gain.value = 190;
      lfo.connect(lg); lg.connect(bp.frequency);
      lfo.start(t); lfo.stop(t + d + 0.3);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.5, t + d * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, 0.35));
    },

    rain: function (E, t, p) {
      var out = E.hit(t, 0.3);
      var bed = E.noise(t, 1.4), hp = E.filt('highpass', 4200), bg = E.env(t, 0.07, 0.3, 1.0);
      bed.connect(hp); hp.connect(bg); bg.connect(out);
      for (var i = 0; i < 11; i++) {
        var tt = t + rnd(0, 0.75), f = rnd(1900, 4200);
        var o = E.osc('sine', f, tt);
        o.frequency.exponentialRampToValueAtTime(f * 0.55, tt + 0.035);
        var g = E.env(tt, rnd(0.05, 0.13), 0.002, 0.04);
        o.connect(g); g.connect(out);
        o.start(tt); o.stop(tt + 0.1);
      }
    },

    thunder: function (E, t, p) {
      var n = E.noise(t, 3, E.brown), lp = E.filt('lowpass', 130, 0.7);
      lp.frequency.exponentialRampToValueAtTime(55, t + 2.4);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.95, t + 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      n.connect(lp); lp.connect(g); g.connect(E.hit(t, 0.55));
      var o = E.osc('sine', 46, t), og = E.env(t, 0.5, 0.02, 1.8);
      o.connect(og); og.connect(E.hit(t)); o.start(t); o.stop(t + 2.2);
    },

    drop: function (E, t, p) {
      var f = freqOf(p) || 620;
      var o = E.osc('sine', f, t);
      o.frequency.exponentialRampToValueAtTime(f * 2.4, t + 0.09);
      var g = E.env(t, 0.3, 0.003, p.d || 0.14);
      o.connect(g); g.connect(E.hit(t, p.v || 0.35));
      o.start(t); o.stop(t + 0.25);
    },

    bubble: function (E, t, p) {
      var f = freqOf(p) || 160;
      var o = E.osc('sine', f, t);
      o.frequency.exponentialRampToValueAtTime(f * 5.5, t + 0.09);
      var g = E.env(t, 0.28, 0.004, 0.1);
      o.connect(g); g.connect(E.hit(t, p.v || 0.3));
      o.start(t); o.stop(t + 0.2);
    },

    splash: function (E, t, p) {
      var n = E.noise(t, 0.45), lp = E.filt('lowpass', 6200, 0.7);
      lp.frequency.exponentialRampToValueAtTime(380, t + 0.38);
      var g = E.env(t, 0.35, 0.004, 0.4);
      n.connect(lp); lp.connect(g); g.connect(E.hit(t, p.v || 0.3));
    },

    bird: function (E, t, p) {
      var out = E.hit(t, 0.35), n = 2 + (Math.random() * 2 | 0);
      for (var i = 0; i < n; i++) {
        var tt = t + i * rnd(0.09, 0.16), f = rnd(2400, 3900);
        var o = E.osc('sine', f, tt);
        o.frequency.exponentialRampToValueAtTime(f * rnd(1.2, 1.45), tt + 0.035);
        o.frequency.exponentialRampToValueAtTime(f * 0.9, tt + 0.07);
        var g = E.env(tt, 0.16, 0.008, 0.07);
        o.connect(g); g.connect(out);
        o.start(tt); o.stop(tt + 0.12);
      }
    },

    cricket: function (E, t, p) {
      var d = p.d || 0.55;
      var o = E.osc('sine', 4300, t);
      var lfo = E.osc('square', 27, t), lg = E.ctx.createGain();
      lg.gain.value = 0.5;
      var gate = E.ctx.createGain();
      gate.gain.value = 0.5;
      lfo.connect(lg); lg.connect(gate.gain);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gate); gate.connect(g); g.connect(E.hit(t, 0.3));
      o.start(t); o.stop(t + d + 0.1);
      lfo.start(t); lfo.stop(t + d + 0.1);
    },

    vinyl: function (E, t, p) {
      var out = E.hit(t);
      var bed = E.noise(t, 1.2, E.brown), lp = E.filt('lowpass', 900), bg = E.env(t, 0.05, 0.15, 0.9);
      bed.connect(lp); lp.connect(bg); bg.connect(out);
      for (var i = 0; i < 22; i++) {
        var tt = t + rnd(0, 0.95);
        var n = E.noise(tt, 0.004), hp = E.filt('highpass', rnd(2500, 6000)), g = E.env(tt, rnd(0.05, 0.16), 0.0005, 0.004);
        n.connect(hp); hp.connect(g); g.connect(out);
      }
    },

    glitch: function (E, t, p) {
      for (var i = 0; i < 8; i++) {
        var tt = t + i * 0.028;
        var o = E.osc('square', rnd(300, 2200), tt);
        var g = E.env(tt, rnd(0.08, 0.2), 0.001, 0.02);
        o.connect(g); g.connect(E.hit(t, 0, 0.08));
        o.start(tt); o.stop(tt + 0.04);
      }
    },

    static: function (E, t, p) {
      var n = E.noise(t, 0.3), hp = E.filt('highpass', 1100);
      var lfo = E.osc('sine', 21, t), lg = E.ctx.createGain();
      lg.gain.value = 0.1;
      var g = E.ctx.createGain();
      g.gain.value = 0.12;
      lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      n.connect(hp); hp.connect(g); g.connect(E.hit(t));
      lfo.start(t); lfo.stop(t + 0.4);
    },

    riser: function (E, t, p) {
      var d = p.d || 1.1;
      var n = E.noise(t, d), bp = E.filt('bandpass', 300, 1.6);
      bp.frequency.exponentialRampToValueAtTime(7200, t + d);
      var g = E.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.24, t + d * 0.85);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, 0.3));
      var o = E.osc('sawtooth', 220, t);
      o.frequency.exponentialRampToValueAtTime(880, t + d);
      var og = E.ctx.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.linearRampToValueAtTime(0.08, t + d * 0.85);
      og.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(og); og.connect(E.hit(t, 0.3));
      o.start(t); o.stop(t + d + 0.1);
    },

    swish: function (E, t, p) {
      var d = p.d || 0.24;
      var n = E.noise(t, d), bp = E.filt('bandpass', 700, 1.4);
      bp.frequency.exponentialRampToValueAtTime(3200, t + d);
      var g = E.env(t, p.g || 0.2, 0.015, d);
      n.connect(bp); bp.connect(g); g.connect(E.hit(t, p.v || 0.2));
    }
  };

  // metal "808" p/ pratos, chimbal, tamborim
  function metal(E, t, p) {
    var out = E.hit(t, p.v || 0.12);
    var hp = E.filt('highpass', p.hp || 7000);
    hp.connect(out);
    var freqs = [263, 400, 421, 474, 587, 845];
    var n = p.oscs || 6;
    for (var i = 0; i < n; i++) {
      var o = E.osc('square', freqs[i % freqs.length] * (1 + (i >= freqs.length ? 0.13 : 0)), t);
      var g = E.env(t, (p.g || 0.3) / n * 2, 0.001, p.d || 0.05);
      o.connect(g); g.connect(hp);
      o.start(t); o.stop(t + (p.d || 0.05) + 0.1);
    }
  }

  /* ---------- dispatcher ---------- */

  Engine.prototype.play = function (spec) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    var fn = BANK[spec && spec.t];
    if (!fn) return;
    var t = this.now() + 0.002 + rnd(0, 0.005);
    try { fn(this, t, spec || {}); }
    catch (e) { /* nunca quebrar a experiencia por causa de 1 som */ }
  };

  Engine.prototype.ensureRec = function () {
    if (!this.recDest) {
      this.recDest = this.ctx.createMediaStreamDestination();
      this.comp.connect(this.recDest);
    }
    return this.recDest;
  };

  window.SND = new Engine();
  window.SND.mtof = mtof;
})();
