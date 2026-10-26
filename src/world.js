import * as THREE from 'three';
import {
  CORE_VERT,
  CORE_FRAG,
  SHARD_VERT,
  SHARD_FRAG,
  DUST_VERT,
  DUST_FRAG,
  GRID_VERT,
  GRID_FRAG,
  GLOW_VERT,
  GLOW_FRAG,
  NEBULA_VERT,
  NEBULA_FRAG,
} from './glsl.js';

export const CHAPTERS = [
  {
    id: 'genese',
    label: 'gênese',
    amp: 0.26,
    freq: 1.15,
    spread: 1.0,
    coreScale: 1.0,
    grid: 0.5,
    spin: 0.06,
    dust: 1.0,
    bloom: 0.55,
    fov: 58,
    pal: ['#ff2e88', '#38e8ff', '#d6ff3f'],
    cam: [0, 0.5, 8.6],
    look: [0, 0.05, 0],
  },
  {
    id: 'ruido',
    label: 'ruído',
    amp: 0.52,
    freq: 2.1,
    spread: 1.4,
    coreScale: 1.2,
    grid: 0.24,
    spin: -0.16,
    dust: 1.35,
    bloom: 0.7,
    fov: 62,
    pal: ['#d6ff3f', '#ff2e88', '#38e8ff'],
    cam: [3.4, 1.7, 5.6],
    look: [0, 0.05, 0],
  },
  {
    id: 'fragmentos',
    label: 'fragmentos',
    amp: 0.15,
    freq: 3.6,
    spread: 2.35,
    coreScale: 0.78,
    grid: 0.85,
    spin: 0.22,
    dust: 1.6,
    bloom: 0.62,
    fov: 68,
    pal: ['#38e8ff', '#7a5cff', '#ff2e88'],
    cam: [-3.6, -1.6, 4.4],
    look: [0, 0.25, 0],
  },
  {
    id: 'laboratorio',
    label: 'laboratório',
    amp: 0.4,
    freq: 0.9,
    spread: 1.7,
    coreScale: 1.55,
    grid: 1.0,
    spin: -0.07,
    dust: 0.85,
    bloom: 0.75,
    fov: 72,
    pal: ['#ff8a3d', '#38e8ff', '#d6ff3f'],
    cam: [0.4, -2.4, 6.6],
    look: [0, 0.65, 0],
  },
  {
    id: 'transmissao',
    label: 'transmissão',
    amp: 0.86,
    freq: 0.62,
    spread: 2.9,
    coreScale: 0.62,
    grid: 0.12,
    spin: 0.3,
    dust: 1.9,
    bloom: 0.8,
    fov: 60,
    pal: ['#ff2e88', '#d6ff3f', '#38e8ff'],
    cam: [0, 1.2, 13.5],
    look: [0, 0.1, 0],
  },
];

const col = (hex) => new THREE.Color(hex);

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export class World {
  constructor(canvas, quality = {}) {
    this.canvas = canvas;
    this.quality = {
      dust: quality.dust ?? 9000,
      shards: quality.shards ?? 240,
      coreDetail: quality.coreDetail ?? 24,
      pixelRatio: quality.pixelRatio ?? 1.6,
    };
    this.disposed = false;
    this.ch = 0;
    this.targetCh = 0;
    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();
    this.drag = new THREE.Vector2();
    this.dragSmooth = new THREE.Vector2();
    this.glitch = 0;
    this.chaos = false;
    this.time = 0;
    this.paletteA = col(CHAPTERS[0].pal[0]);
    this.paletteB = col(CHAPTERS[0].pal[1]);
    this.paletteC = col(CHAPTERS[0].pal[2]);
    this.paletteTarget = {
      a: col(CHAPTERS[0].pal[0]),
      b: col(CHAPTERS[0].pal[1]),
      c: col(CHAPTERS[0].pal[2]),
    };
    this.fov = CHAPTERS[0].fov;
    this.fovTarget = CHAPTERS[0].fov;
    this.chapterOverride = { amp: 1, spread: 1 };

    // objetos reutilizados no loop (zero alocação por frame)
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._off = new THREE.Vector3();
    this._axisY = new THREE.Vector3(0, 1, 0);

    this._initRenderer();
    this._initScene();
    this._initUniforms();
    this._initCore();
    this._initShards();
    this._initDust();
    this._initGrid();
    this._initRings();
    this._initGlow();
    this._initNebula();
    this._initCamera();

    this.resize(window.innerWidth, window.innerHeight);
  }

  /* ───────────────────────────── setup ───────────────────────────── */

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(0x05030b, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
  }

  _initUniforms() {
    this.U = {
      uTime: { value: 0 },
      uAmp: { value: CHAPTERS[0].amp },
      uFreq: { value: CHAPTERS[0].freq },
      uWarp: { value: 0 },
      uA: { value: this.paletteA },
      uB: { value: this.paletteB },
      uC: { value: this.paletteC },
      uChaos: { value: 0 },
      uOpacity: { value: 1 },
      uSize: { value: 1.15 },
    };
  }

  _initCore() {
    const geo = new THREE.IcosahedronGeometry(1.55, this.quality.coreDetail);
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.U.uTime,
        uAmp: this.U.uAmp,
        uFreq: this.U.uFreq,
        uWarp: this.U.uWarp,
        uA: this.U.uA,
        uB: this.U.uB,
        uC: this.U.uC,
        uChaos: this.U.uChaos,
      },
      vertexShader: CORE_VERT,
      fragmentShader: CORE_FRAG,
    });
    this.core = new THREE.Mesh(geo, this.coreMat);
    this.scene.add(this.core);

    // casca de arame — dá a leitura "estrutura exposta"
    const wire = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.95, 2));
    this.shellMat = new THREE.LineBasicMaterial({
      color: col('#38e8ff'),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shell = new THREE.LineSegments(wire, this.shellMat);
    this.scene.add(this.shell);
  }

  _initShards() {
    const COUNT = this.quality.shards;
    const geo = new THREE.OctahedronGeometry(1, 0);
    this.shardMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.U.uTime,
        uA: this.U.uA,
        uB: this.U.uB,
        uC: this.U.uC,
      },
      vertexShader: SHARD_VERT,
      fragmentShader: SHARD_FRAG,
      side: THREE.DoubleSide,
    });

    this.shards = new THREE.InstancedMesh(geo, this.shardMat, COUNT);
    this.shards.frustumCulled = false;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();

    this.shardBases = [];

    for (let i = 0; i < COUNT; i++) {
      const radius = 2.15 + Math.pow(Math.random(), 1.6) * 3.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(rand(-1, 1));
      pos.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) * 0.78,
        radius * Math.sin(phi) * Math.sin(theta)
      );
      e.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));
      q.setFromEuler(e);
      const s = rand(0.03, 0.105);
      scl.set(s * rand(0.6, 1.6), s * rand(0.6, 1.9), s * rand(0.3, 1));
      m.compose(pos, q, scl);
      this.shards.setMatrixAt(i, m);
      this.shardBases.push({ pos: pos.clone(), ratio: radius / 6.05, scl: scl.clone() });
    }
    this.shards.instanceMatrix.needsUpdate = true;
    this.scene.add(this.shards);
  }

  _initDust() {
    const COUNT = this.quality.dust;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const r = 2.6 + Math.pow(Math.random(), 0.7) * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(rand(-1, 1));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.85;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      seeds[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.dustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.U.uTime,
        uSize: this.U.uSize,
        uA: this.U.uA,
        uB: this.U.uB,
      },
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.dust = new THREE.Points(geo, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  _initGrid() {
    this.gridMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.U.uTime,
        uA: this.U.uA,
        uB: this.U.uB,
        uOpacity: this.U.uOpacity,
      },
      vertexShader: GRID_VERT,
      fragmentShader: GRID_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.grid = new THREE.Mesh(new THREE.PlaneGeometry(110, 110, 1, 1), this.gridMat);
    this.grid.rotation.x = -Math.PI / 2;
    this.grid.position.y = -3.6;
    this.scene.add(this.grid);
  }

  _initRings() {
    this.rings = new THREE.Group();
    const specs = [
      { r: 2.26, tube: 0.004, color: '#38e8ff', rx: 0.9, rz: 0.25, op: 0.5 },
      { r: 2.72, tube: 0.003, color: '#ff2e88', rx: -0.55, rz: 0.9, op: 0.4 },
      { r: 3.35, tube: 0.0025, color: '#d6ff3f', rx: 1.4, rz: -0.4, op: 0.28 },
    ];
    this.ringMats = [];
    specs.forEach((s) => {
      const mat = new THREE.MeshBasicMaterial({
        color: col(s.color),
        transparent: true,
        opacity: s.op,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(s.r, s.tube, 3, 220),
        mat
      );
      mesh.rotation.set(s.rx, 0, s.rz);
      this.rings.add(mesh);
      this.ringMats.push(mat);
    });
    this.scene.add(this.rings);
  }

  _initGlow() {
    this.glowMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.U.uTime,
        uColor: this.U.uA,
      },
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), this.glowMat);
    this.glow.renderOrder = -1;
    this.scene.add(this.glow);
  }

  _initNebula() {
    this.nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: this.U.uTime,
        uA: this.U.uA,
        uB: this.U.uB,
        uC: this.U.uC,
      },
      vertexShader: NEBULA_VERT,
      fragmentShader: NEBULA_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    });
    this.nebula = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 24), this.nebulaMat);
    this.nebula.renderOrder = -10;
    this.nebula.frustumCulled = false;
    this.scene.add(this.nebula);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CHAPTERS[0].fov,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    const camPts = CHAPTERS.map((c) => new THREE.Vector3(...c.cam));
    const lookPts = CHAPTERS.map((c) => new THREE.Vector3(...c.look));
    this.camCurve = new THREE.CatmullRomCurve3(camPts, false, 'catmullrom', 0.5);
    this.lookCurve = new THREE.CatmullRomCurve3(lookPts, false, 'catmullrom', 0.5);

    this.camPos = new THREE.Vector3().copy(camPts[0]);
    this.lookAt = new THREE.Vector3().copy(lookPts[0]);
    this.tmpTarget = new THREE.Vector3();
    this.tmpOffset = new THREE.Vector3();
    this.tmpRight = new THREE.Vector3();
    this.tmpUp = new THREE.Vector3();

    this.camera.position.copy(this.camPos);
    if (this.nebula) this.nebula.position.copy(this.camPos);
    this.camera.lookAt(this.lookAt);
  }

  /* ───────────────────────────── api ───────────────────────────── */

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // retrato precisa de mais distância para o organismo caber
    const aspect = w / h;
    this.frameDist = aspect >= 1.3 ? 1 : 1 + (1.3 - aspect) * 0.62;
  }

  setChapter(i) {
    this.targetCh = THREE.MathUtils.clamp(i, 0, CHAPTERS.length - 1);
    const c = CHAPTERS[Math.round(this.targetCh)];
    this.paletteTarget.a.copy(col(c.pal[0]));
    this.paletteTarget.b.copy(col(c.pal[1]));
    this.paletteTarget.c.copy(col(c.pal[2]));
    this.fovTarget = c.fov;
  }

  setPalette(hexA, hexB, hexC) {
    const a = new THREE.Color(hexA);
    this.paletteTarget.a.copy(a);
    if (hexB) this.paletteTarget.b.copy(new THREE.Color(hexB));
    else this.paletteTarget.b.copy(a).offsetHSL(0.18, 0.15, 0.1);
    if (hexC) this.paletteTarget.c.copy(new THREE.Color(hexC));
    else this.paletteTarget.c.copy(a).offsetHSL(0.42, 0, 0.2);
    // aplica imediatamente para resposta tátil
    this.paletteA.copy(this.paletteTarget.a);
    this.paletteB.copy(this.paletteTarget.b);
    this.paletteC.copy(this.paletteTarget.c);
  }

  setNoiseLevel(v) {
    this.chapterOverride.amp = THREE.MathUtils.clamp(v, 0, 2.2);
  }

  setSpread(v) {
    this.chapterOverride.spread = THREE.MathUtils.clamp(v, 0.2, 3.4);
  }

  pulse(strength = 1) {
    this.glitch = Math.min(2.4, this.glitch + strength);
  }

  setChaos(on) {
    this.chaos = !!on;
    if (this.chaos) this.pulse(1.6);
  }

  setPointer(x, y) {
    this.pointer.set(x, y);
  }

  setDrag(yaw, pitch) {
    this.drag.set(yaw, pitch);
  }

  /* ───────────────────────────── loop ───────────────────────────── */

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const t = this.time;

    // aproxima do capítulo alvo
    const k = 1 - Math.exp(-dt * 2.4);
    this.ch += (this.targetCh - this.ch) * k;
    const chIndex = THREE.MathUtils.clamp(this.ch, 0, CHAPTERS.length - 1);
    const a = CHAPTERS[Math.floor(chIndex)];
    const b = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.ceil(chIndex))];
    const f = chIndex - Math.floor(chIndex);

    const lerp = (p, q) => p + (q - p) * f;
    const amp = lerp(a.amp, b.amp) * (this.chapterOverride?.amp ?? 1);
    const spread = lerp(a.spread, b.spread) * (this.chapterOverride?.spread ?? 1);
    const coreScale = lerp(a.coreScale, b.coreScale);
    const gridOp = lerp(a.grid, b.grid);
    const dust = lerp(a.dust, b.dust);
    const spin = lerp(a.spin, b.spin);
    this.currentSpread = spread;

    // glitch decai
    this.glitch *= Math.exp(-dt * 3.4);
    const glitchAmt = this.glitch + (this.chaos ? 0.55 : 0) + Math.abs(this.drag.x) * 0.35;

    this.U.uTime.value = t;
    this.U.uAmp.value = THREE.MathUtils.lerp(this.U.uAmp.value, amp, 1 - Math.exp(-dt * 3));
    this.U.uFreq.value = THREE.MathUtils.lerp(this.U.uFreq.value, lerp(a.freq, b.freq), 1 - Math.exp(-dt * 3));
    this.U.uChaos.value = THREE.MathUtils.lerp(this.U.uChaos.value, glitchAmt * 0.6, 1 - Math.exp(-dt * 6));
    this.U.uOpacity.value = gridOp;
    this.U.uWarp.value = THREE.MathUtils.lerp(
      this.U.uWarp.value,
      this.chaos ? 1.4 : 0.35 + glitchAmt * 0.4,
      1 - Math.exp(-dt * 2)
    );

    // paleta
    const kp = 1 - Math.exp(-dt * 2.2);
    this.paletteA.lerp(this.paletteTarget.a, kp);
    this.paletteB.lerp(this.paletteTarget.b, kp);
    this.paletteC.lerp(this.paletteTarget.c, kp);
    if (this.chaos && Math.random() < dt * 0.55) {
      this.setPalette(
        new THREE.Color().setHSL(Math.random(), 0.9, 0.6).getHexString()
      );
    }

    // núcleo
    const breathe = 1 + Math.sin(t * 0.55) * 0.02;
    this.core.scale.setScalar(coreScale * breathe);
    this.core.rotation.y += dt * spin;
    this.core.rotation.x = Math.sin(t * 0.12) * 0.12;
    this.core.rotation.z = Math.cos(t * 0.09) * 0.08;

    this.shell.rotation.y -= dt * spin * 1.6;
    this.shell.rotation.x += dt * 0.05;
    this.shellMat.color.copy(this.paletteB);
    this.shellMat.opacity = 0.1 + glitchAmt * 0.12;
    this.shell.scale.setScalar(coreScale * (1.02 + Math.sin(t * 0.7) * 0.02));

    // estilhaços
    const m = this._m;
    const q = this._q;
    const e = this._e;
    const p = this._p;
    const s = this._s;
    for (let i = 0; i < this.shardBases.length; i++) {
      const base = this.shardBases[i];
      const orbit = t * (0.05 + base.ratio * 0.16) * (this.chaos ? 3.2 : 1);
      const r = spread * (0.75 + base.ratio * 0.55);
      p.copy(base.pos).multiplyScalar(r);
      p.applyAxisAngle(this._axisY, orbit);
      p.y += Math.sin(t * 0.5 + i) * 0.12 * spread;
      e.set(
        p.x * 0.4 + t * 0.1,
        p.y * 0.4 + t * 0.14,
        p.z * 0.4 + t * 0.07
      );
      q.setFromEuler(e);
      s.copy(base.scl).multiplyScalar(1 + glitchAmt * 0.5);
      m.compose(p, q, s);
      this.shards.setMatrixAt(i, m);
    }
    this.shards.instanceMatrix.needsUpdate = true;
    this.shards.rotation.y += dt * 0.02;

    // poeira
    this.dust.rotation.y += dt * 0.012;
    this.dust.rotation.x = Math.sin(t * 0.05) * 0.1;
    this.U.uSize.value = 1.15 * dust * (1 + glitchAmt * 0.8);

    // anéis
    this.rings.rotation.y += dt * 0.18;
    this.rings.rotation.x = Math.sin(t * 0.2) * 0.25;
    this.rings.scale.setScalar(coreScale * 0.96);
    this.ringMats[0].color.copy(this.paletteB);
    this.ringMats[1].color.copy(this.paletteA);
    this.ringMats[2].color.copy(this.paletteC);

    // grade
    this.grid.position.y = -3.6 + Math.sin(t * 0.3) * 0.15;
    this.gridMat.uniforms.uOpacity.value = gridOp * (0.8 + glitchAmt * 0.5);

    // brilho volumétrico falso
    this.glowMat.uniforms.uColor.value = this.paletteA;
    this.glow.lookAt(this.camera.position);
    this.glow.scale.setScalar(coreScale * (1 + Math.sin(t * 0.8) * 0.05 + glitchAmt * 0.4));

    this.nebula.position.copy(this.camera.position);

    this._updateCamera(dt, chIndex, t, glitchAmt);
  }

  _updateCamera(dt, chIndex, t, glitchAmt) {
    const kp = 1 - Math.exp(-dt * 6);
    this.pointerSmooth.lerp(this.pointer, kp);
    this.dragSmooth.lerp(this.drag, 1 - Math.exp(-dt * 7));

    const u = THREE.MathUtils.clamp(chIndex / (CHAPTERS.length - 1), 0, 1);
    this.camCurve.getPointAt(u, this.tmpOffset);
    this.lookCurve.getPointAt(u, this.tmpTarget);

    const breathe = Math.sin(t * 0.4) * 0.12;
    this.tmpTarget.y += breathe * 0.5;
    this.tmpTarget.x += this.pointerSmooth.x * 0.55;
    this.tmpTarget.y += this.pointerSmooth.y * 0.4;

    // rotação orbital em torno do alvo: mouse + arrasto
    const yaw = this.pointerSmooth.x * 0.34 + this.dragSmooth.x;
    const pitch = THREE.MathUtils.clamp(
      this.pointerSmooth.y * 0.22 - this.dragSmooth.y,
      -1.05,
      1.05
    );

    const off = this._off.copy(this.tmpOffset).sub(this.tmpTarget);
    const dist = off.length() * (this.frameDist || 1);
    const phi = Math.atan2(off.x, off.z) + yaw;
    const theta = THREE.MathUtils.clamp(
      Math.acos(THREE.MathUtils.clamp(off.y / dist, -1, 1)) + pitch,
      0.34,
      Math.PI - 0.34
    );

    off.set(
      dist * Math.sin(theta) * Math.sin(phi),
      dist * Math.cos(theta),
      dist * Math.sin(theta) * Math.cos(phi)
    );

    const wanted = off.add(this.tmpTarget);
    this.camPos.lerp(wanted, 1 - Math.exp(-dt * 4));
    this.lookAt.lerp(this.tmpTarget, 1 - Math.exp(-dt * 5));

    // tremor de glitch
    if (glitchAmt > 0.05) {
      const j = glitchAmt * 0.06;
      this.camPos.x += (Math.random() - 0.5) * j;
      this.camPos.y += (Math.random() - 0.5) * j;
    }

    this.camera.position.copy(this.camPos);
    if (this.nebula) this.nebula.position.copy(this.camPos);
    this.camera.lookAt(this.lookAt);

    // rolagem sutil da câmera
    this.camera.rotation.z += Math.sin(t * 0.25) * 0.006 + this.dragSmooth.x * 0.04;

    const kf = 1 - Math.exp(-dt * 2.5);
    this.fov += (this.fovTarget - this.fov) * kf;
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  get glitchAmount() {
    return this.glitch;
  }
}
