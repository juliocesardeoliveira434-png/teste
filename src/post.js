import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// pass final: distorção de lente, aberração cromática, glitch, grão, vinheta
const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmount: { value: 0 },
    uAberration: { value: 0.0016 },
    uGrain: { value: 0.038 },
    uVignette: { value: 1.05 },
    uBarrel: { value: 0.06 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    uniform float uAberration;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uBarrel;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;

      // distorção de lente
      vec2 d = uv - 0.5;
      uv = 0.5 + d * (1.0 + uBarrel * dot(d, d) * 2.4);

      // fatias de glitch
      float sliceId = floor(uv.y * 74.0);
      float sliceRand = hash(vec2(sliceId, floor(uTime * 9.0)));
      float sliceOn = step(0.86, sliceRand) * uAmount;
      uv.x += (sliceRand - 0.5) * 0.09 * sliceOn;

      // tremor global
      uv += (vec2(hash(vec2(uTime, 1.7)), hash(vec2(2.3, uTime))) - 0.5) * 0.006 * uAmount;

      // aberração cromática radial
      vec2 dir = uv - 0.5;
      float r = length(dir);
      float ab = uAberration * (1.0 + uAmount * 3.4);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * ab * (0.6 + r)).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * ab * (0.6 + r)).b;

      // varredura horizontal luminosa
      float scan = sin((uv.y + uTime * 0.03) * uResolution.y * 1.6) * 0.5 + 0.5;
      col *= 0.965 + 0.035 * scan;

      // grão analógico
      float g = hash(uv * uResolution + fract(uTime) * 431.7) - 0.5;
      col += g * uGrain * (0.6 + uAmount);

      // realce de borda ciano/magenta nas franjas
      float edge = smoothstep(0.42, 0.92, r);
      col.r += edge * 0.03;
      col.b += edge * 0.05;

      // vinheta
      float vig = smoothstep(1.25, 0.25, r * uVignette * 1.55);
      col *= mix(0.35, 1.0, vig);

      // fora do quadro = preto puro
      vec2 outside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
      col *= outside.x * outside.y;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class Post {
  constructor(renderer, scene, camera, width, height, pixelRatio = 1.6) {
    this.pixelRatio = pixelRatio;
    this.renderer = renderer;

    const target = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      samples: 2,
    });

    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.pixelRatio));
    this.composer.setSize(width, height);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.62, 0.82);
    this.composer.addPass(this.bloom);

    this.finalPass = new ShaderPass(FinalShader);
    this.finalPass.uniforms.uResolution.value.set(width, height);
    this.composer.addPass(this.finalPass);

    this.composer.addPass(new OutputPass());

    this.bloomTarget = 0.55;
  }

  setCamera(camera) {
    this.renderPass.camera = camera;
  }

  setBloom(v) {
    this.bloomTarget = v;
  }

  setAberration(v) {
    this.aberrationTarget = v;
  }

  resize(width, height) {
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.pixelRatio));
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
    this.finalPass.uniforms.uResolution.value.set(width, height);
  }

  update(dt, time, amount) {
    const u = this.finalPass.uniforms;
    u.uTime.value = time;
    u.uAmount.value = THREE.MathUtils.lerp(u.uAmount.value, amount, 1 - Math.exp(-dt * 6));
    u.uAberration.value = THREE.MathUtils.lerp(
      u.uAberration.value,
      this.aberrationTarget,
      1 - Math.exp(-dt * 2.4)
    );
    this.bloom.strength = THREE.MathUtils.lerp(
      this.bloom.strength,
      this.bloomTarget,
      1 - Math.exp(-dt * 2.4)
    );
  }

  render(dt) {
    this.composer.render(dt);
  }
}
