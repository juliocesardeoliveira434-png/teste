// ruído simplex 3D (Ashima Arts / Stefan Gustavson) + utilitários compartilhados

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

// estudo fotográfico analítico — usado pelo vidro, metal e rótulo.
// duas softboxes + teto: é o que faz o vidro parecer vidro.
export const STUDIO = /* glsl */ `
uniform vec3 uKeyDir;
uniform vec3 uRimDir;
uniform vec3 uKeyCol;
uniform vec3 uRimCol;

vec3 studioEnv(vec3 d) {
  float up = smoothstep(-0.7, 0.95, d.y);
  vec3 base = mix(vec3(0.018, 0.020, 0.028), vec3(0.085, 0.090, 0.115), up);

  float box1 = smoothstep(0.70, 0.965, dot(d, normalize(vec3(-0.62, 0.34, 0.7))));
  float box2 = smoothstep(0.88, 0.998, dot(d, normalize(vec3(0.88, 0.10, -0.44))));
  float top  = smoothstep(0.88, 1.0, dot(d, normalize(vec3(0.05, 0.99, 0.10))));

  vec3 c = base;
  c += uKeyCol * box1 * mix(0.75, 1.55, smoothstep(0.0, 0.35, d.y));
  c += uRimCol * box2 * 1.05;
  c += vec3(0.85, 0.90, 1.0) * top * 0.42;

  // piso escuro: nenhuma reflexão forte vindo de baixo
  c *= mix(0.28, 1.0, smoothstep(-1.0, -0.18, d.y));
  return c;
}
`;

export const DUST_VERT = /* glsl */ `
uniform float uTime;
uniform float uSize;

attribute float aSeed;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float s = aSeed;

  p.x += sin(uTime * 0.14 + s * 12.0) * 2.4;
  p.y += cos(uTime * 0.11 + s * 9.0) * 1.6;
  p.z += sin(uTime * 0.09 + s * 5.0) * 2.0;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;

  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uSize * (0.3 + s * 1.4) * (14.0 / max(dist, 1.0)), 0.6, 9.0);

  float twinkle = 0.45 + 0.55 * sin(uTime * (0.5 + s * 1.8) + s * 40.0);
  vColor = mix(vec3(0.95, 0.86, 0.78), vec3(0.55, 0.80, 1.0), step(0.55, s)) * (0.25 + twinkle * 0.45);
  vAlpha = smoothstep(2.0, 8.0, dist) * (0.16 + 0.5 * twinkle) * smoothstep(150.0, 30.0, dist);
}
`;

export const DUST_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.02, length(c));
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;
