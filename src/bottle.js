import * as THREE from 'three';
import { NOISE, STUDIO } from './glsl.js';

/* ────────────────────────────────────────────────────────────────
   Garrafa Nº 01 — modelada por perfil, sem nenhum asset externo.

   Escala: 1 unidade = 1 cm. Medidas reais de uma garrafa bordalesa:
     altura total ....... 300 mm
     diâmetro do corpo ..  76 mm
     diâmetro do gargalo   24 mm
     capacidade ......... 750 ml
   ──────────────────────────────────────────────────────────────── */

export const DIMS = {
  height: 30.0,
  bodyRadius: 3.8,
  neckRadius: 1.2,
  bodyTop: 17.5,
  shoulderTop: 23.6,
  neckTop: 28.4,
  liquidY: 17.15,
  label: { y: 9.55, height: 9.2, radius: 3.862 },
  weight: 1180,
  glassWeight: 480,
  capacity: 750,
};

/* perfil do vidro: do fundo (punt) até o lábio, em pares [raio, altura] */
const PROFILE = [
  [0.0, 1.28], [0.85, 1.18], [1.9, 0.86], [2.9, 0.34], [3.55, 0.06],
  [3.8, 0.22], [3.8, 3.0], [3.8, 8.0], [3.8, 13.0], [3.8, 17.5],
  [3.75, 18.5], [3.55, 19.8], [3.1, 21.0], [2.45, 22.1], [1.8, 23.0],
  [1.38, 23.7], [1.22, 24.6], [1.2, 26.0], [1.2, 27.6],
  [1.3, 28.1], [1.42, 28.55], [1.42, 29.35], [1.32, 29.8], [1.16, 30.0],
];

const LIQUID_PROFILE = [
  [0.0, 1.62], [1.6, 1.52], [2.9, 1.5], [3.5, 1.58], [3.62, 1.9],
  [3.62, 6.0], [3.62, 11.0], [3.62, 16.2], [3.6, DIMS.liquidY],
  [3.1, DIMS.liquidY + 0.05], [1.6, DIMS.liquidY + 0.07], [0.0, DIMS.liquidY + 0.08],
];

const GLASS_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUvLocal;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vUvLocal = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const GLASS_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uGlass;
uniform vec3 uLiquid;
uniform float uLiquidY;
uniform float uTurbidity;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUvLocal;

${STUDIO}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;

  vec3 R = reflect(-V, N);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.8);

  vec3 envC = studioEnv(R);

  vec3 H1 = normalize(normalize(uKeyDir) + V);
  vec3 H2 = normalize(normalize(uRimDir) + V);
  float s1 = pow(max(dot(N, H1), 0.0), 300.0);
  float s2 = pow(max(dot(N, H2), 0.0), 130.0);

  // abaixo da linha do vinho o vidro escurece e puxa para o rubi
  float below = smoothstep(uLiquidY + 0.25, uLiquidY - 0.25, vWorld.y);
  vec3 inner = mix(uGlass, uLiquid * 1.7, below * uTurbidity);

  vec3 col = inner * (0.09 + fres * 0.55);
  col += envC * (0.16 + fres * 0.85);
  col += uKeyCol * s1 * 1.5;
  col += uRimCol * s2 * 0.75;
  // aro de luz na silhueta — é o que faz a garrafa existir contra o fundo
  col += mix(uKeyCol, uRimCol, 0.5) * pow(fres, 6.0) * 0.55;

  // costura vertical do vidro soprado
  float mold = smoothstep(0.975, 1.0, abs(sin(vWorld.y * 2.1 + 1.1)));
  col *= 1.0 - mold * 0.04;

  float alpha = 0.34 + fres * 0.62;
  gl_FragColor = vec4(max(col, 0.0), alpha);
}
`;

const LIQUID_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uLiquid;
uniform vec3 uGlass;

varying vec3 vWorld;
varying vec3 vNormal;

${NOISE}
${STUDIO}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;

  float lam = 0.35 + 0.65 * max(dot(N, normalize(uKeyDir)), 0.0);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
  vec3 H = normalize(normalize(uKeyDir) + V);
  float spec = pow(max(dot(N, H), 0.0), 70.0);

  float swirl = snoise(vec3(vWorld.xz * 1.6, vWorld.y * 0.8 + uTime * 0.08));

  vec3 col = uLiquid * (0.5 + lam * 0.65);
  col += uLiquid * fres * 1.35;
  col += uLiquid * swirl * 0.10;
  col += uKeyCol * spec * 0.55;
  col = mix(col, col * 0.6 + uGlass * 0.25, 0.18);

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

const METAL_VERT = GLASS_VERT;

const METAL_FRAG = /* glsl */ `
uniform vec3 uMetal;
uniform float uTime;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUvLocal;

${STUDIO}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;

  vec3 R = reflect(-V, N);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);
  vec3 envC = studioEnv(R);

  // frisos verticais da cápsula
  float ridges = 0.5 + 0.5 * sin(vUvLocal.x * 6.2831 * 46.0);
  float seam = smoothstep(0.012, 0.0, abs(vUvLocal.y - 0.58));

  vec3 H = normalize(normalize(uKeyDir) + V);
  float spec = pow(max(dot(N, H), 0.0), 80.0);

  vec3 col = uMetal * (0.10 + envC * 0.95) * (0.80 + ridges * 0.34);
  col += uKeyCol * spec * 1.15;
  col += uRimCol * pow(fres, 3.2) * 0.35;
  col *= 1.0 - seam * 0.45;
  // brilho escuro no fundo do gargalo (sombra do ombro)
  col *= mix(0.72, 1.0, smoothstep(23.6, 25.4, vWorld.y));

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

const LABEL_VERT = GLASS_VERT;

const LABEL_FRAG = /* glsl */ `
uniform sampler2D uMap;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUvLocal;

${STUDIO}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;

  vec4 texel = texture2D(uMap, vUvLocal);

  float lam = 0.40 + 0.52 * max(dot(N, normalize(uKeyDir)), 0.0);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
  vec3 H = normalize(normalize(uKeyDir) + V);
  float spec = pow(max(dot(N, H), 0.0), 26.0) * 0.09;

  // grão do papel algodão
  float grain = fract(sin(dot(vUvLocal * 940.0, vec2(12.9898, 78.233))) * 43758.5453);

  vec3 col = texel.rgb * lam;
  col *= 0.86;                       // papel algodão não é branco de tela
  col *= 0.955 + grain * 0.06;
  col += uKeyCol * spec;
  col += uRimCol * fres * 0.12;

  // sombreamento de cilindro: escurece as bordas do rótulo
  float wrapShade = 0.72 + 0.28 * smoothstep(0.0, 0.55, dot(N, normalize(vec3(0.4, 0.1, 1.0))));
  col *= mix(0.78, 1.0, wrapShade);

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

function lathe(pairs, samples, segments) {
  const curve = new THREE.SplineCurve(pairs.map(([x, y]) => new THREE.Vector2(x, y)));
  const pts = curve.getPoints(samples);
  return new THREE.LatheGeometry(pts, segments);
}

/* ───────────────────────── rótulo em canvas ───────────────────────── */

export function createLabelTexture() {
  const W = 2048;
  const H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');

  const draw = () => {
    // papel
    c.fillStyle = '#ece2cf';
    c.fillRect(0, 0, W, H);

    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,255,255,0.28)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(90,60,40,0.12)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // fibra do papel
    for (let i = 0; i < 2400; i++) {
      c.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 50},${
        70 + Math.random() * 40
      },${0.03 + Math.random() * 0.05})`;
      c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1);
    }

    // faixa de acento (fica atrás da garrafa)
    c.fillStyle = '#b0113f';
    c.fillRect(0, 0, 70, H);
    c.fillRect(W - 70, 0, 70, H);

    const cx = W / 2;
    c.textAlign = 'center';

    // cabeçalho
    c.fillStyle = 'rgba(20,16,14,0.68)';
    c.font = '500 27px "JetBrains Mono", monospace';
    c.letterSpacing = '9px';
    c.fillText('VINHO TINTO · SAFRA 2023', cx, 128);

    // nome
    c.fillStyle = '#141010';
    c.font = '400 236px "Anton", "Arial Narrow", sans-serif';
    c.letterSpacing = '4px';
    c.fillText('NÃO', cx, 372);
    c.fillText('LUGAR', cx, 596);

    // marca d'água do número
    c.save();
    c.globalAlpha = 0.06;
    c.font = '400 300px "Anton", "Arial Narrow", sans-serif';
    c.fillText('01', cx, 900);
    c.restore();

    // tagline
    c.fillStyle = 'rgba(20,16,14,0.76)';
    c.font = 'italic 400 56px "Instrument Serif", Georgia, serif';
    c.letterSpacing = '0px';
    c.fillText('o mesmo terroir, nenhum atalho', cx, 690);

    // régua
    c.strokeStyle = 'rgba(20,16,14,0.32)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 430, 748);
    c.lineTo(cx + 430, 748);
    c.stroke();

    // ficha
    c.fillStyle = 'rgba(20,16,14,0.78)';
    c.font = '500 25px "JetBrains Mono", monospace';
    c.letterSpacing = '5px';
    c.fillText('750 ML   ·   13,5% VOL   ·   LOTE 001 / 2400', cx, 806);

    // rodapé
    c.fillStyle = 'rgba(20,16,14,0.52)';
    c.font = '400 20px "JetBrains Mono", monospace';
    c.letterSpacing = '4px';
    c.fillText('ENGARRAFADO SEM FILTRAGEM · SEDIMENTO É ASSINATURA', cx, 872);
    c.fillText('ALTO DA SERRA · GARRAFA Nº 01', cx, 926);

    // código de barras discreto
    let x = 150;
    c.fillStyle = '#141010';
    for (let i = 0; i < 34; i++) {
      const w = 2 + Math.random() * 5;
      c.fillRect(x, 950, w, 52);
      x += w + 4 + Math.random() * 4;
    }
    c.textAlign = 'left';
    c.fillStyle = 'rgba(20,16,14,0.55)';
    c.font = '400 17px "JetBrains Mono", monospace';
    c.letterSpacing = '3px';
    c.fillText('7 896123 000019', 1600, 984);
    c.textAlign = 'center';
  };

  draw();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  // redesenha quando as fontes reais chegarem (evita rótulo em fallback)
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      draw();
      tex.needsUpdate = true;
    });
  }

  return tex;
}

/* ───────────────────────── montagem ───────────────────────── */

export function createBottle(quality = {}) {
  const group = new THREE.Group();
  group.name = 'bottle';

  const uniforms = {
    uTime: { value: 0 },
    uKeyDir: { value: new THREE.Vector3(-0.62, 0.46, 0.72).normalize() },
    uRimDir: { value: new THREE.Vector3(0.88, 0.28, -0.4).normalize() },
    uKeyCol: { value: new THREE.Color('#fff1e2') },
    uRimCol: { value: new THREE.Color('#7fd8ff') },
    uGlass: { value: new THREE.Color('#0d2a22') },
    uLiquid: { value: new THREE.Color('#4e0b1c') },
    uMetal: { value: new THREE.Color('#b8935a') },
    uLiquidY: { value: DIMS.liquidY },
    uTurbidity: { value: 0.92 },
    uMap: { value: null },
  };

  const segments = quality.radialSegments ?? 128;
  const profileSamples = quality.profileSamples ?? 150;

  // ── vidro
  const glassMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(lathe(PROFILE, profileSamples, segments), glassMat);
  glass.renderOrder = 4;
  group.add(glass);

  // ── vinho
  const liquidMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: GLASS_VERT,
    fragmentShader: LIQUID_FRAG,
    side: THREE.DoubleSide,
  });
  const liquid = new THREE.Mesh(lathe(LIQUID_PROFILE, 90, segments), liquidMat);
  liquid.renderOrder = 1;
  group.add(liquid);

  // ── rótulo (setor de cilindro colado no corpo)
  const labelGeo = new THREE.CylinderGeometry(
    DIMS.label.radius,
    DIMS.label.radius,
    DIMS.label.height,
    Math.round(segments * 0.75),
    1,
    true,
    -Math.PI * 0.82,
    Math.PI * 1.64
  );
  const labelTex = createLabelTexture();
  uniforms.uMap.value = labelTex;
  const labelMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: LABEL_VERT,
    fragmentShader: LABEL_FRAG,
    side: THREE.FrontSide,
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = DIMS.label.y;
  label.renderOrder = 2;
  group.add(label);

  // ── cápsula metálica + anéis
  const metalMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: METAL_VERT,
    fragmentShader: METAL_FRAG,
    side: THREE.DoubleSide,
  });

  const capsule = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 1.35, 6.2, segments, 1, true),
    metalMat
  );
  capsule.position.y = 27.25;
  group.add(capsule);

  const capTop = new THREE.Mesh(new THREE.CircleGeometry(1.32, segments), metalMat);
  capTop.rotation.x = -Math.PI / 2;
  capTop.position.y = 30.35;
  group.add(capTop);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.055, 10, segments), metalMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 23.78;
  group.add(collar);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.032, 8, segments), metalMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 29.5;
  group.add(ring);

  // ── âncoras para as cotas (medidas) em espaço local
  const anchors = {
    base: new THREE.Vector3(0, 0, 0),
    top: new THREE.Vector3(0, DIMS.height + 0.34, 0),
    bodyCenter: new THREE.Vector3(0, 5.6, 0),
    bodyRadius: DIMS.bodyRadius,
    neckCenter: new THREE.Vector3(0, 26.2, 0),
    neckRadius: DIMS.neckRadius,
    shoulder: new THREE.Vector3(0, DIMS.bodyTop, 0),
  };

  return {
    group,
    uniforms,
    anchors,
    labelTexture: labelTex,

    setKeyColor(hex) {
      uniforms.uKeyCol.value.set(hex);
    },
    setRimColor(hex) {
      uniforms.uRimCol.value.set(hex);
    },
    setGlassColor(hex) {
      uniforms.uGlass.value.set(hex);
    },
    setLiquidColor(hex) {
      uniforms.uLiquid.value.set(hex);
    },
    setMetalColor(hex) {
      uniforms.uMetal.value.set(hex);
    },

    update(t) {
      uniforms.uTime.value = t;
    },

    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material !== glassMat) return;
      });
      glassMat.dispose();
      liquidMat.dispose();
      labelMat.dispose();
      metalMat.dispose();
      labelTex.dispose();
    },
  };
}
