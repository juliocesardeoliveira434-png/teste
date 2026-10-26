// áudio 100% procedural — nenhum arquivo, nenhuma licença, só matemática

const ROOTS = [55, 49, 61.74, 65.41, 43.65]; // A1, G1, B1, C2, F1

export class Drone {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.on = false;
    this.chapter = 0;
    this.master = null;
  }

  async init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    this.master = master;

    // reverb curto e barato: feedback delay em rede
    const delay = ctx.createDelay(1.2);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1400;
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);

    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(wet);
    wet.connect(master);

    // osciladores do drone
    this.voices = [];
    const specs = [
      { type: 'sawtooth', ratio: 1, detune: -7, gain: 0.16 },
      { type: 'sawtooth', ratio: 1, detune: 9, gain: 0.14 },
      { type: 'sine', ratio: 0.5, detune: 0, gain: 0.3 },
      { type: 'triangle', ratio: 2, detune: 3, gain: 0.06 },
    ];

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 5.5;
    this.filter = filter;

    const bus = ctx.createGain();
    bus.gain.value = 0.85;

    specs.forEach((s) => {
      const osc = ctx.createOscillator();
      osc.type = s.type;
      osc.frequency.value = ROOTS[0] * s.ratio;
      osc.detune.value = s.detune;
      const g = ctx.createGain();
      g.gain.value = s.gain;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.voices.push({ osc, gain: g, spec: s });
    });

    filter.connect(bus);
    bus.connect(master);
    bus.connect(delay);

    // LFO no corte do filtro
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // textura de ruído (vento de dados)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 900;
    nf.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    const noiseLfo = ctx.createOscillator();
    noiseLfo.frequency.value = 0.045;
    const noiseLfoGain = ctx.createGain();
    noiseLfoGain.gain.value = 420;
    noiseLfo.connect(noiseLfoGain);
    noiseLfoGain.connect(nf.frequency);
    noiseLfo.start();
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(master);
    noise.start();
    this.noiseGain = ng;

    // filtro de saída para o grave não dominar
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 28;
    master.disconnect();
    master.connect(hp);
    hp.connect(ctx.destination);

    this.ready = true;
  }

  async enable() {
    await this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.on = true;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(0.22, this.ctx.currentTime, 0.8);
    return true;
  }

  disable() {
    this.on = false;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.35);
  }

  setChapter(i) {
    this.chapter = i;
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    const root = ROOTS[i % ROOTS.length];
    this.voices.forEach((v) => {
      v.osc.frequency.setTargetAtTime(root * v.spec.ratio, now, 0.6);
    });
    this.filter.frequency.setTargetAtTime(380 + i * 90, now, 0.9);
  }

  blip(freq = 880, dur = 0.16, type = 'sine', vol = 0.05) {
    if (!this.ready || !this.on) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.55), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  sweep() {
    if (!this.ready || !this.on) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(200, now);
    f.frequency.exponentialRampToValueAtTime(4200, now + 1.4);
    f.Q.value = 2.5;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.4);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    osc.connect(f);
    f.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 1.7);
  }

  chord() {
    if (!this.ready || !this.on) return;
    const base = ROOTS[this.chapter % ROOTS.length] * 4;
    [1, 1.5, 2.0, 2.9966].forEach((r, i) => {
      setTimeout(() => this.blip(base * r, 0.6, 'sine', 0.035), i * 70);
    });
  }
}
