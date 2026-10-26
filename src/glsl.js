// ruído simplex 3D (Ashima Arts / Stefan Gustavson) + utilitários de shader

export const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const CORE_VERT = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uWarp;

varying vec3 vPosW;
varying float vNoise;

${NOISE}

void main() {
  vec3 dir = normalize(position);
  float n1 = snoise(dir * uFreq + vec3(0.0, uTime * 0.13, uTime * 0.09));
  float n2 = snoise(dir * (uFreq * 2.9) - vec3(uTime * 0.21, 0.0, uTime * 0.17));
  float n3 = snoise(dir * (uFreq * 6.1) + vec3(uTime * 0.05, uTime * 0.31, 0.0));

  float d = n1 * 0.62 + n2 * 0.28 + n3 * 0.10;
  vNoise = d;

  vec3 p = position + dir * d * uAmp;
  // dobra o espaço: deformação lateral que dá o aspecto de matéria viva
  p.xz *= 1.0 + uWarp * 0.18 * sin(dir.y * 3.0 + uTime * 0.4);
  p.y += uWarp * 0.22 * sin(dir.x * 4.0 + uTime * 0.25);

  vec4 wp = modelMatrix * vec4(p, 1.0);
  vPosW = wp.xyz;

  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const CORE_FRAG = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uTime;
uniform float uChaos;

varying vec3 vPosW;
varying float vNoise;

void main() {
  vec3 N = normalize(cross(dFdx(vPosW), dFdy(vPosW)));
  vec3 V = normalize(cameraPosition - vPosW);
  if (dot(N, V) < 0.0) N = -N;

  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
  float lambert = dot(N, normalize(vec3(0.5, 0.9, 0.35))) * 0.5 + 0.5;

  vec3 col = mix(uA, uB, smoothstep(0.15, 0.95, lambert));
  col = mix(col, uC, smoothstep(0.05, 0.95, vNoise) * 0.55);

  // corpo escuro + bordas incandescentes
  col *= 0.07 + fres * 1.25;
  col += uB * pow(fres, 4.5) * 0.55;
  col += uC * pow(max(vNoise, 0.0), 3.0) * (0.32 + uChaos * 0.8);
  col += uA * 0.04 * smoothstep(0.2, 1.0, vNoise);

  // varredura vertical sutil
  col *= 0.94 + 0.06 * sin(vPosW.y * 24.0 - uTime * 1.4);

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export const SHARD_VERT = /* glsl */ `
uniform float uTime;

varying vec3 vN;
varying vec3 vV;
varying float vSeed;

void main() {
  float seed = fract(float(gl_InstanceID) * 0.6180339887);

  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.0);
  #endif

  vec3 p = position;
  float ang = uTime * (0.25 + seed * 1.4) + seed * 6.2831;
  // gira cada estilhaço em torno do próprio eixo
  float c = cos(ang);
  float s = sin(ang);
  p = vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
  p.z += sin(uTime * 0.7 + seed * 12.0) * 0.35;

  vec4 wp = im * vec4(p, 1.0);
  vec4 mv = modelViewMatrix * wp;

  vN = normalize(mat3(modelViewMatrix) * mat3(im) * normal);
  vV = normalize(-mv.xyz);
  vSeed = seed;

  gl_Position = projectionMatrix * mv;
}
`;

export const SHARD_FRAG = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uTime;

varying vec3 vN;
varying vec3 vV;
varying float vSeed;

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.6);

  vec3 base = mix(uA, uC, step(0.55, vSeed));
  base = mix(base, uB, 0.35);

  vec3 col = base * (0.06 + fres * 0.95);
  col += uB * pow(fres, 4.0) * 0.35;

  gl_FragColor = vec4(col, 1.0);
}
`;

export const DUST_VERT = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform vec3 uA;
uniform vec3 uB;

attribute float aSeed;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float s = aSeed;

  p.x += sin(uTime * 0.14 + s * 12.0) * 0.55;
  p.y += cos(uTime * 0.11 + s * 9.0) * 0.55;
  p.z += sin(uTime * 0.09 + s * 5.0) * 0.45;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;

  gl_Position = projectionMatrix * mv;
  float px = uSize * (0.3 + s * 1.5) * (11.0 / max(dist, 0.6));
  gl_PointSize = clamp(px, 0.6, 16.0);

  float twinkle = 0.45 + 0.55 * sin(uTime * (0.6 + s * 2.2) + s * 40.0);
  vColor = mix(uA, uB, step(0.5, s)) * (0.22 + twinkle * 0.5);
  vAlpha = smoothstep(0.0, 2.5, dist) * (0.18 + 0.55 * twinkle) * smoothstep(36.0, 9.0, dist);
  vAlpha *= 0.55;
}
`;

export const DUST_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.02, d);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

export const GRID_VERT = /* glsl */ `
varying vec3 vWorld;
varying float vDist;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const GRID_FRAG = /* glsl */ `
uniform vec3 uA;
uniform vec3 uB;
uniform float uTime;
uniform float uOpacity;

varying vec3 vWorld;
varying float vDist;

float lines(float coord, float width) {
  float g = abs(fract(coord - 0.5) - 0.5);
  return smoothstep(width, 0.0, g);
}

void main() {
  vec2 p = vWorld.xz;

  float thin = max(lines(p.x * 0.5, 0.02), lines(p.y * 0.5, 0.02));
  float bold = max(lines(p.x * 0.1, 0.006), lines(p.y * 0.1, 0.006));

  // pulso que atravessa o plano
  float pulse = smoothstep(0.5, 0.0, abs(length(p) - mod(uTime * 6.0, 44.0))) * 0.9;
  float ring = smoothstep(0.25, 0.0, abs(length(p) - 14.0)) * 0.5;

  vec3 col = mix(uA, uB, clamp(bold, 0.0, 1.0));
  float a = (thin * 0.22 + bold * 0.55 + pulse + ring) * uOpacity;
  a *= smoothstep(46.0, 6.0, vDist);
  a *= smoothstep(0.0, 5.0, vDist);

  if (a < 0.003) discard;
  gl_FragColor = vec4(col, a);
}
`;

export const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(max(0.0, 1.0 - d), 5.0);
  float wobble = 0.85 + 0.15 * sin(uTime * 0.8);
  gl_FragColor = vec4(uColor * a * wobble * 0.5, a * 0.28);
}
`;

export const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const NEBULA_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const NEBULA_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
varying vec3 vDir;

${NOISE}

void main() {
  vec3 d = normalize(vDir);

  float n1 = snoise(d * 1.8 + vec3(uTime * 0.012, uTime * 0.008, 0.0)) * 0.5 + 0.5;
  float n2 = snoise(d * 4.6 - vec3(0.0, uTime * 0.01, uTime * 0.006)) * 0.5 + 0.5;
  float cloud = pow(n1 * 0.65 + n2 * 0.35, 2.1);

  float horizon = pow(1.0 - abs(d.y), 3.4);

  vec3 base = vec3(0.012, 0.008, 0.032);
  vec3 col = base;
  col += uB * cloud * 0.085 * (0.35 + horizon);
  col += uA * pow(n2, 3.0) * 0.06;
  col += uC * cloud * horizon * 0.035;
  col += vec3(0.02, 0.015, 0.05) * horizon * 0.5;

  gl_FragColor = vec4(col, 1.0);
}
`;
