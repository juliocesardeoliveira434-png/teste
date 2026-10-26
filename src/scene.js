import * as THREE from 'three';
import { createBottle, DIMS } from './bottle.js';
import { DUST_VERT, DUST_FRAG } from './glsl.js';

/* ────────────────────────────────────────────────────────────────
   Plano de produto — a garrafa num estudo fotográfico escuro.
   Cinco planos de câmera costurados por scroll; giro com inércia.
   ──────────────────────────────────────────────────────────────── */

export const CHAPTERS = [
  {
    id: 'garrafa',
    label: 'garrafa',
    cam: [0, 16.4, 50],
    look: [-2.4, 15.0, 0],
    fov: 38,
    spin: 0.24,
    grid: 0,
    floor: 0.85,
    bloom: 0.44,
    aberr: 0.0011,
    float: 0.35,
    dock: false,
    key: '#fff1e2',
    rim: '#7fd8ff',
    liquid: '#4e0b1c',
  },
  {
    id: 'medidas',
    label: 'medidas',
    cam: [0, 15.2, 100],
    look: [0, 15.2, 0],
    fov: 24,
    spin: 0,
    grid: 1,
    floor: 0.7,
    bloom: 0.3,
    aberr: 0.0004,
    float: 0,
    dock: true,
    key: '#eef7ff',
    rim: '#38e8ff',
    liquid: '#4e0b1c',
  },
  {
    id: 'rotulo',
    label: 'rótulo',
    cam: [3.4, 11.4, 34],
    look: [3.1, 9.6, 0],
    fov: 32,
    spin: 0.09,
    grid: 0,
    floor: 0.4,
    bloom: 0.4,
    aberr: 0.0014,
    float: 0.3,
    dock: true,
    key: '#fff2e4',
    rim: '#ff7ab0',
    liquid: '#560d21',
  },
  {
    id: 'vidro',
    label: 'vidro',
    cam: [13.5, 28.6, 27.5],
    look: [0, 26.4, 0],
    fov: 30,
    spin: 0.15,
    grid: 0,
    floor: 0.3,
    bloom: 0.5,
    aberr: 0.0018,
    float: 0.4,
    dock: false,
    key: '#ffe9d6',
    rim: '#9ad7ff',
    liquid: '#4a0a1a',
  },
  {
    id: 'compra',
    label: 'compra',
    cam: [0, 16.8, 52],
    look: [-2.0, 14.8, 0],
    fov: 40,
    spin: 0.18,
    grid: 0,
    floor: 0.8,
    bloom: 0.42,
    aberr: 0.0009,
    float: 0.5,
    dock: false,
    key: '#fff3e6',
    rim: '#ffb37a',
    liquid: '#4e0b1c',
  },
];

const FLOOR_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FLOOR_FRAG = /* glsl */ `
uniform float uTime;
uniform float uGrid;
uniform float uFloor;
uniform vec3 uKey;
uniform vec3 uRim;

varying vec3 vWorld;
varying vec2 vUv;

float band(float coord, float width) {
  float g = abs(fract(coord - 0.5) - 0.5);
  return smoothstep(width, 0.0, g);
}

void main() {
  float d = length(vWorld.xz);

  // poço de luz sob a garrafa
  float pool = smoothstep(26.0, 2.0, d);
  vec3 col = mix(vec3(0.008, 0.009, 0.013), vec3(0.042, 0.045, 0.058), pool);
  col += uRim * pow(smoothstep(24.0, 0.0, d), 3.0) * 0.035;
  col += uKey * pow(smoothstep(12.0, 0.0, d), 4.0) * 0.03;

  // malha técnica (capítulo das medidas)
  float minorD = max(band(vWorld.x, 0.045), band(vWorld.z, 0.045));
  float majorD = max(band(vWorld.x * 0.2, 0.012), band(vWorld.z * 0.2, 0.012));
  float fade = smoothstep(60.0, 4.0, d);

  float gridAmt = (minorD * 0.16 + majorD * 0.5) * fade;
  col += mix(uRim, uKey, majorD) * gridAmt * uGrid;

  // reflexo vertical suave das softboxes, sem virar feixe
  float streak = smoothstep(2.6, 0.0, abs(vWorld.x + 5.0)) * smoothstep(30.0, 4.0, abs(vWorld.z));
  col += uKey * streak * 0.012 * uFloor;

  float alpha = smoothstep(120.0, 22.0, d) * mix(0.85, 1.0, uFloor);
  gl_FragColor = vec4(max(col, 0.0), alpha * uFloor);
}
`;

const SHADOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SHADOW_FRAG = /* glsl */ `
uniform float uStrength;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * vec2(2.0, 1.25);
  float d = length(p);
  float core = smoothstep(0.42, 0.0, d);
  float soft = smoothstep(0.95, 0.05, d);
  float a = (core * 0.55 + soft * 0.45) * uStrength;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}
`;

const BACKDROP_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BACKDROP_FRAG = /* glsl */ `
uniform vec3 uKey;
uniform vec3 uRim;
uniform vec3 uBg;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float up = smoothstep(-0.4, 0.9, d.y);
  vec3 col = mix(uBg * 0.55, uBg, up);

  // halo atrás do produto
  float halo = pow(max(0.0, d.z), 3.0) * smoothstep(0.85, -0.2, d.y);
  col += uRim * halo * 0.06;
  col += uKey * pow(max(0.0, -d.x), 4.0) * smoothstep(0.9, -0.1, d.y) * 0.03;

  // chão infinito
  col *= mix(0.5, 1.0, smoothstep(-0.75, -0.1, d.y));

  gl_FragColor = vec4(col, 1.0);
}
`;

export class ProductScene {
  constructor(canvas, quality = {}) {
    this.canvas = canvas;
    this.quality = {
      dust: quality.dust ?? 3200,
      radialSegments: quality.radialSegments ?? 128,
      pixelRatio: quality.pixelRatio ?? 1.6,
    };

    this.time = 0;
    this.ch = 0;
    this.targetCh = 0;
    this.glitch = 0;
    this.gridTarget = 0;
    this.gridAmt = 0;
    this.spinVel = 0;
    this.spinSmooth = CHAPTERS[0].spin;
    this.rotY = 0;
    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();
    this.camPos = new THREE.Vector3(...CHAPTERS[0].cam);
    this.lookAt = new THREE.Vector3(...CHAPTERS[0].look);
    this.fov = CHAPTERS[0].fov;
    this.aspect = 1;

    this._initRenderer();
    this._initScene();
    this._initWorld();
    this._initCamera();

    this.resize(window.innerWidth, window.innerHeight);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setClearColor(0x050508, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _initScene() {
    this.scene = new THREE.Scene();

    this.backdropMat = new THREE.ShaderMaterial({
      uniforms: {
        uKey: { value: new THREE.Color(CHAPTERS[0].key) },
        uRim: { value: new THREE.Color(CHAPTERS[0].rim) },
        uBg: { value: new THREE.Color('#0a0a12') },
      },
      vertexShader: BACKDROP_VERT,
      fragmentShader: BACKDROP_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.backdrop = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 24), this.backdropMat);
    this.backdrop.frustumCulled = false;
    this.scene.add(this.backdrop);
  }

  _initWorld() {
    // piso
    this.floorMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGrid: { value: 0 },
        uFloor: { value: 1 },
        uKey: { value: new THREE.Color(CHAPTERS[0].key) },
        uRim: { value: new THREE.Color(CHAPTERS[0].rim) },
      },
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      transparent: true,
      depthWrite: false,
    });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 1, 1), this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.02;
    this.floor.renderOrder = 0;
    this.scene.add(this.floor);

    // sombra de contato
    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: { uStrength: { value: 0.85 } },
      vertexShader: SHADOW_VERT,
      fragmentShader: SHADOW_FRAG,
      transparent: true,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), this.shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.012;
    this.shadow.renderOrder = 1;
    this.scene.add(this.shadow);

    // garrafa
    this.bottle = createBottle({
      radialSegments: this.quality.radialSegments,
      profileSamples: 150,
    });
    this.bottlePivot = new THREE.Group();
    this.bottlePivot.add(this.bottle.group);
    this.scene.add(this.bottlePivot);

    // poeira no ar
    const COUNT = this.quality.dust;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 4 + Math.pow(Math.random(), 0.65) * 44;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.random() * 42 - 2;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.dustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: 1.1 } },
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

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(CHAPTERS[0].fov, 1, 0.5, 800);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.lookAt);

    this._tmpV = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._colA = new THREE.Color();
    this._colB = new THREE.Color();
    this._colC = new THREE.Color();
  }

  /* ───────────────────────────── api ───────────────────────────── */

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.aspect = w / h;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    // retrato: recua para a garrafa caber inteira
    this.frameDist = this.aspect >= 1.2 ? 1 : 1 + (1.2 - this.aspect) * 1.05;
    // retrato: sobe o produto para não brigar com o texto embaixo
    this.portraitLift = this.aspect >= 0.95 ? 0 : Math.min(17, (0.95 - this.aspect) * 30);
  }

  setChapter(i) {
    this.targetCh = THREE.MathUtils.clamp(i, 0, CHAPTERS.length - 1);
  }

  setPointer(x, y) {
    this.pointer.set(x, y);
  }

  dragSpin(dx) {
    this.spinVel += dx * 0.02;
    this.spinVel = THREE.MathUtils.clamp(this.spinVel, -3.2, 3.2);
  }

  pulse(strength = 1) {
    this.glitch = Math.min(2.2, this.glitch + strength);
  }

  setSpin(v) {
    this.spinOverride = THREE.MathUtils.clamp(v, 0, 3);
  }

  setGrid(on) {
    this.gridTarget = on ? 1 : 0;
  }

  setLights(keyHex, rimHex) {
    if (keyHex) this.bottle.setKeyColor(keyHex);
    if (rimHex) this.bottle.setRimColor(rimHex);
  }

  setGlassTint(hex) {
    this.bottle.setGlassColor(hex);
  }

  setLiquidTint(hex) {
    this.bottle.setLiquidColor(hex);
  }

  /* pontos de medição em espaço de mundo (para as cotas em DOM) */
  getMeasurePoints() {
    const g = this.bottle.group;
    g.updateWorldMatrix(true, false);
    this.camera.updateMatrixWorld();

    this._right.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
    const a = this.bottle.anchors;

    const base = g.localToWorld(a.base.clone());
    const top = g.localToWorld(a.top.clone());
    const body = g.localToWorld(a.bodyCenter.clone());
    const neck = g.localToWorld(a.neckCenter.clone());

    return {
      base,
      top,
      left: body.clone().addScaledVector(this._right, -DIMS.bodyRadius),
      right: body.clone().addScaledVector(this._right, DIMS.bodyRadius),
      mid: body,
      neckLeft: neck.clone().addScaledVector(this._right, -DIMS.neckRadius),
      neckRight: neck.clone().addScaledVector(this._right, DIMS.neckRadius),
      shoulder: g.localToWorld(a.shoulder.clone()),
    };
  }

  get spinSpeed() {
    return Math.abs(this.spinSmooth) + Math.abs(this.spinVel) * 0.4;
  }

  get glitchAmount() {
    return this.glitch;
  }

  /* ───────────────────────────── loop ───────────────────────────── */

  update(dt, ease = dt) {
    dt = Math.min(dt, 0.05);
    ease = Math.min(ease, 0.5);
    this.time += dt;
    const t = this.time;

    // plano de câmera
    const k = 1 - Math.exp(-ease * 2.6);
    this.ch += (this.targetCh - this.ch) * k;
    if (Math.abs(this.targetCh - this.ch) > 1.4) this.ch = this.targetCh;

    const i0 = Math.floor(THREE.MathUtils.clamp(this.ch, 0, CHAPTERS.length - 1));
    const i1 = Math.min(CHAPTERS.length - 1, i0 + 1);
    const f = THREE.MathUtils.clamp(this.ch - i0, 0, 1);
    const A = CHAPTERS[i0];
    const B = CHAPTERS[i1];
    const mix = (a, b) => a + (b - a) * f;

    if (Math.abs(this.ch - this.targetCh) < 0.0015) this.ch = this.targetCh;

    // cores do estudo
    this._colA.set(A.key).lerp(this._colB.set(B.key), f);
    this._colB.set(A.rim);
    this._colC.set(B.rim);
    this._colB.lerp(this._colC, f);
    const kc = 1 - Math.exp(-ease * 3);
    this.bottle.uniforms.uKeyCol.value.lerp(this._colA, kc);
    this.bottle.uniforms.uRimCol.value.lerp(this._colB, kc);
    this.backdropMat.uniforms.uKey.value.copy(this.bottle.uniforms.uKeyCol.value);
    this.backdropMat.uniforms.uRim.value.copy(this.bottle.uniforms.uRimCol.value);
    this.floorMat.uniforms.uKey.value.copy(this.bottle.uniforms.uKeyCol.value);
    this.floorMat.uniforms.uRim.value.copy(this.bottle.uniforms.uRimCol.value);

    this._colA.set(A.liquid).lerp(this._colB.set(B.liquid), f);
    this.bottle.uniforms.uLiquid.value.lerp(this._colA, kc);

    // giro da garrafa (fluido, com inércia)
    const targetSpin = this.spinOverride ?? mix(A.spin, B.spin);
    this.spinSmooth += (targetSpin - this.spinSmooth) * (1 - Math.exp(-ease * 2.2));
    this.spinVel *= Math.exp(-ease * 1.35);

    const docks = (A.dock && f < 0.5) || (B.dock && f >= 0.5);
    const dockAmt = Math.max(
      A.dock ? 1 - f : 0,
      B.dock ? f : 0
    );

    if (dockAmt > 0.02) {
      // assenta o rótulo de frente para a câmera, com balanço de vitrine
      const camAz = Math.atan2(this.camPos.x, this.camPos.z);
      const sway = Math.sin(t * 0.42) * 0.17 * dockAmt;
      const target = camAz + sway;
      const kd = 1 - Math.exp(-ease * (2.6 * dockAmt));
      this.rotY += (target - this.rotY) * kd;
      this.spinVel *= Math.exp(-ease * 3.2);
      if (Math.abs(target - this.rotY) < 0.0006) this.rotY = target;
    } else {
      this.rotY += (this.spinSmooth + this.spinVel) * dt;
    }

    const floatAmt = mix(A.float, B.float);
    this.bottlePivot.rotation.y = this.rotY;
    this.bottlePivot.position.y = Math.sin(t * 0.85) * 0.12 * floatAmt;
    this.bottlePivot.rotation.z = Math.sin(t * 0.45) * 0.006 * floatAmt;

    // paralaxe
    this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-ease * 4));

    // malha técnica
    this.gridAmt += ((this.spinOverride === 0 ? 1 : mix(A.grid, B.grid)) - this.gridAmt) *
      (1 - Math.exp(-ease * 3));
    this.floorMat.uniforms.uGrid.value = this.gridAmt;
    this.floorMat.uniforms.uFloor.value = mix(A.floor, B.floor);

    // glitch decai
    this.glitch *= Math.exp(-ease * 3.2);
    this.bottle.uniforms.uTurbidity.value =
      0.85 + Math.sin(t * 0.6) * 0.05 + this.glitch * 0.2;

    this.bottle.update(t);
    this.dustMat.uniforms.uTime.value = t;
    this.dust.rotation.y += dt * 0.012;
    this.floorMat.uniforms.uTime.value = t;

    // sombra acompanha o giro/float
    this.shadow.position.y = 0.012;
    this.shadowMat.uniforms.uStrength.value = 0.9 - Math.abs(this.bottlePivot.position.y) * 0.25;

    this._updateCamera(dt, ease, A, B, f, mix);
  }

  _updateCamera(dt, ease, A, B, f, mix) {
    const toPos = this._tmpV.set(
      mix(A.cam[0], B.cam[0]),
      mix(A.cam[1], B.cam[1]),
      mix(A.cam[2], B.cam[2])
    );
    const dist = (this.frameDist || 1);
    toPos.multiplyScalar(dist);

    const toLook = new THREE.Vector3(
      mix(A.look[0], B.look[0]),
      mix(A.look[1], B.look[1]),
      mix(A.look[2], B.look[2])
    );
    toLook.y *= dist;
    toLook.x *= dist;
    toLook.y -= this.portraitLift || 0;

    // paralaxe do ponteiro
    toPos.x += this.pointerSmooth.x * 1.6;
    toPos.y += this.pointerSmooth.y * 1.1;
    toLook.x += this.pointerSmooth.x * 0.5;
    toLook.y += this.pointerSmooth.y * 0.35;

    const kc = 1 - Math.exp(-ease * 3.2);
    this.camPos.lerp(toPos, kc);
    this.lookAt.lerp(toLook, kc);

    if (this.camPos.distanceTo(toPos) > 40) this.camPos.copy(toPos);

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.lookAt);
    this.camera.rotation.z += this.pointerSmooth.x * 0.004;

    const targetFov = mix(A.fov, B.fov);
    this.fov += (targetFov - this.fov) * (1 - Math.exp(-ease * 2.6));
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  get postAmount() {
    // glitch discreto: produto não é música eletrônica
    return this.glitch * 0.10 + Math.abs(this.spinVel) * 0.015;
  }

  get postAberration() {
    const i0 = Math.floor(THREE.MathUtils.clamp(this.ch, 0, CHAPTERS.length - 1));
    const i1 = Math.min(CHAPTERS.length - 1, i0 + 1);
    const f = THREE.MathUtils.clamp(this.ch - i0, 0, 1);
    return CHAPTERS[i0].aberr + (CHAPTERS[i1].aberr - CHAPTERS[i0].aberr) * f;
  }

  get bloomTarget() {
    const i0 = Math.floor(THREE.MathUtils.clamp(this.ch, 0, CHAPTERS.length - 1));
    const i1 = Math.min(CHAPTERS.length - 1, i0 + 1);
    const f = THREE.MathUtils.clamp(this.ch - i0, 0, 1);
    return CHAPTERS[i0].bloom + (CHAPTERS[i1].bloom - CHAPTERS[i0].bloom) * f;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  get cameraPosition() {
    return this.camera.position;
  }
}
