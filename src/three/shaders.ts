export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uFlow;
uniform float uProgress;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uMouse;
uniform float uMouseStrength;
uniform vec3 uShockPos;
uniform float uShockT;
uniform float uAudio;
uniform float uVelocity;
uniform vec3 uColorA;
uniform vec3 uColorB;

attribute vec3 aS1;
attribute vec3 aS2;
attribute vec3 aS3;
attribute vec3 aS4;
attribute vec3 aS5;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

vec3 shape(int i){
  if(i == 0){
    vec3 p = position;
    p.xz = rot(uTime * 0.12) * p.xz;
    p.xy = rot(uTime * 0.05) * p.xy;
    float breathe = sin(uTime * 1.3 + aRand.y * 6.2831) * 0.05 + sin(uTime * 0.6) * 0.07;
    p *= 1.0 + breathe + uAudio * 0.35;
    return p;
  }
  if(i == 1){
    vec3 p = aS1;
    float r = length(p.xz);
    p.xz = rot(uTime * (0.03 + 0.28 / (r + 1.0))) * p.xz;
    return p;
  }
  if(i == 2){
    vec3 p = aS2;
    p.z = mod(p.z + 60.0 + uFlow * (0.6 + aRand.z * 0.8), 70.0) - 60.0;
    p.xy = rot(uTime * 0.08 + p.z * 0.015) * p.xy;
    return p;
  }
  if(i == 3){
    vec3 p = aS3;
    if(aRand.w > 0.86){
      p.xy = rot(uTime * 0.5) * p.xy;
    } else {
      float r = length(p.xz);
      p.xz = rot(uTime * 2.4 / pow(max(r, 1.0), 1.5)) * p.xz;
    }
    return p;
  }
  if(i == 4){
    vec3 p = aS4;
    float d = length(p.xz);
    float y = sin(d * 1.1 - uTime * 1.8) * 0.75 * exp(-d * 0.05)
            + sin(p.x * 0.55 + uTime * 1.3) * 0.28
            + cos(p.z * 0.45 - uTime * 0.9) * 0.28;
    p.y = y * (1.0 + uAudio * 3.5);
    return p;
  }
  vec3 p = aS5;
  p.xy = rot(uTime * 0.15) * p.xy;
  p.xz = rot(uTime * 0.1) * p.xz;
  p *= 1.0 + uAudio * 0.2;
  return p;
}

void main(){
  float prog = clamp(uProgress, 0.0, 5.0);
  float fi = floor(prog);
  int i0 = int(fi);
  int i1 = int(min(fi + 1.0, 5.0));
  float f = prog - fi;
  float stag = clamp((f - aRand.x * 0.35) / 0.65, 0.0, 1.0);
  stag = stag * stag * (3.0 - 2.0 * stag);

  vec3 a = shape(i0);
  vec3 b = shape(i1);
  vec3 pos = mix(a, b, stag);

  float arc = sin(stag * 3.14159);
  vec3 swirl = vec3(
    sin(aRand.y * 40.0 + uTime * 0.7),
    cos(aRand.z * 40.0 + uTime * 0.6),
    sin(aRand.w * 40.0 + uTime * 0.5)
  );
  pos += swirl * arc * 2.6;

  pos += vec3(
    sin(uTime * 0.5 + aRand.y * 20.0),
    cos(uTime * 0.4 + aRand.z * 20.0),
    sin(uTime * 0.45 + aRand.w * 20.0)
  ) * 0.035;

  // Cursor repulsion
  vec3 toM = pos - uMouse;
  float md = length(toM);
  float infl = smoothstep(2.8, 0.0, md) * uMouseStrength;
  pos += normalize(toM + 0.0001) * infl * 1.5;

  // Click shockwave
  vec3 toS = pos - uShockPos;
  float sd = length(toS);
  float wave = sd - uShockT * 9.0;
  float shock = exp(-wave * wave * 0.5) * exp(-uShockT * 0.8);
  pos += normalize(toS + 0.0001) * shock * 1.8;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.35 + aRand.y * aRand.y * 1.5) * (1.0 + uAudio * 0.8 + infl * 0.9 + shock * 1.6 + uVelocity * 0.4);
  gl_PointSize = size * uPixelRatio / max(-mv.z, 0.1);

  vec3 col = mix(uColorA, uColorB, aRand.z);
  col += vec3(infl * 0.5 + shock * 1.4);
  col *= 0.7 + 0.3 * sin(uTime * (1.0 + aRand.x * 3.0) + aRand.w * 30.0);
  vColor = col;
  vAlpha = smoothstep(0.3, 2.5, -mv.z) * (0.5 + aRand.x * 0.5);
}
`;

export const particleFragment = /* glsl */ `
uniform float uBrightness;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if(d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.2);
  gl_FragColor = vec4(vColor * a * vAlpha * uBrightness, 1.0);
}
`;

export const bgVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

export const bgFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform vec2 uMouse;
uniform vec2 uRes;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  p += uMouse * 0.04;
  float n = fbm(p * 1.5 + vec2(uTime * 0.018, -uTime * 0.012));
  float n2 = fbm(p * 2.8 - n * 1.5 + uTime * 0.025);
  vec3 col = mix(uBgA, uBgB, n2) * smoothstep(0.3, 0.95, n) * 1.6;
  col += uBgB * 0.25 * smoothstep(0.9, 0.0, length(p));
  col *= smoothstep(1.4, 0.15, length(p));
  gl_FragColor = vec4(col, 1.0);
}
`;

export const starVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.5 + 0.5 * sin(uTime * (0.4 + aSeed * 2.0) + aSeed * 100.0);
  gl_PointSize = (1.0 + aSeed * 2.6) * uPixelRatio * (0.6 + tw * 0.6);
  vA = 0.25 + tw * 0.75;
}
`;

export const starFragment = /* glsl */ `
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if(d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0);
  gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a * vA * 0.8, 1.0);
}
`;
