import type * as THREE from 'three';

/** Keep phase coordinates small even when the render origin moves far from the starting town. */
const RIPPLE_PERIOD = 64;
const TIME_PERIOD = 24;

export class TerrainFinish {
  private readonly origin = { value: [0, 0] };
  private readonly time = { value: 0 };
  private readonly night = { value: 0 };

  constructor(material: THREE.MeshLambertMaterial) {
    material.customProgramCacheKey = () => 'terrain-water-ripples';
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uRippleOrigin = this.origin;
      shader.uniforms.uRippleTime = this.time;
      shader.uniforms.uRippleNight = this.night;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
attribute float water;
uniform vec2 uRippleOrigin;
varying vec2 vRippleXZ;
varying float vWater;`,
        )
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
vRippleXZ = (modelMatrix * vec4(transformed, 1.0)).xz + uRippleOrigin;
vWater = water;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uRippleTime;
uniform float uRippleNight;
varying vec2 vRippleXZ;
varying float vWater;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
// Break long crests into short strokes. Integer wave counts make the pattern wrap
// smoothly when either the world origin or the elapsed time wraps.
if (vWater > 0.5 && vViewPosition.z < 80.0) {
  vec2 p = vRippleXZ * (2.0 * PI / ${RIPPLE_PERIOD}.0);
  float t = uRippleTime * (2.0 * PI / ${TIME_PERIOD}.0);
  float bend = sin(dot(p, vec2(4.0, 5.0)) + t);
  float crest = sin(dot(p, vec2(13.0, -27.0)) + bend * 1.2 - t * 3.0);
  float gaps = sin(dot(p, vec2(25.0, 11.0)) + bend - t);
  float strokes = smoothstep(0.82, 1.0, crest) * smoothstep(0.0, 0.87, gaps);
  float nearFade = 1.0 - smoothstep(34.0, 80.0, vViewPosition.z);
  float detail = nearFade * mix(1.0, 0.45, uRippleNight);
  diffuseColor.rgb *= 1.0 + detail * (crest * 0.04 + strokes * 0.22);
}`,
        );
    };
  }

  setOrigin(x: number, z: number): void {
    this.origin.value[0] = x % RIPPLE_PERIOD;
    this.origin.value[1] = z % RIPPLE_PERIOD;
  }

  update(dt: number, night: number): void {
    this.time.value = (this.time.value + dt) % TIME_PERIOD;
    this.night.value = night;
  }
}
