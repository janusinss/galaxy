import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { buildShapes } from "./shapes";
import {
  particleVertex,
  particleFragment,
  bgVertex,
  bgFragment,
  starVertex,
  starFragment,
} from "./shaders";

const PALETTE: [string, string][] = [
  ["#ffd2a1", "#ff6a3d"],
  ["#b26bff", "#ff5fa2"],
  ["#5ee7ff", "#3d5bff"],
  ["#ffbe5c", "#ff3d00"],
  ["#3dffb5", "#2a9dff"],
  ["#ffffff", "#b48cff"],
];

const CAM: { pos: [number, number, number]; look: [number, number, number]; shift: number }[] = [
  { pos: [0, 0, 9], look: [0, 0, 0], shift: 0 },
  { pos: [0, 7, 11], look: [0, -0.5, 0], shift: -3.4 },
  { pos: [0, 0, 7], look: [0, 0, -20], shift: 0 },
  { pos: [0, 1.3, 12.5], look: [0, 0, 0], shift: -3.6 },
  { pos: [0, 5, 12], look: [0, -1, 0], shift: 3.2 },
  { pos: [0, 0, 11], look: [0, 0, 0], shift: -3.2 },
];

const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

export class Experience {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private mat: THREE.ShaderMaterial;
  private bgMat: THREE.ShaderMaterial;
  private starMat: THREE.ShaderMaterial;
  private stars: THREE.Points;
  private hole: THREE.Mesh;
  private clock = new THREE.Clock();
  private raf = 0;

  private targetProgress = 0;
  private progress = 0;
  private mouseTarget = new THREE.Vector2();
  private mouse = new THREE.Vector2();
  private mouseActive = 0;
  private velTarget = 0;
  private velocity = 0;
  private flow = 0;
  private shockStart = -100;
  private finaleOutro = 0;
  private finaleTarget = 0;

  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane();
  private look = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private colors = PALETTE.map(([a, b]) => [new THREE.Color(a), new THREE.Color(b)]);
  private isMobile: boolean;

  getAudioLevel: () => number = () => 0;
  onFrame?: (velocity: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const pr = Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 1.75);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
    this.camera.position.set(0, 0, 9);

    // Background nebula
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uBgA: { value: new THREE.Color() },
        uBgB: { value: new THREE.Color() },
        uMouse: { value: new THREE.Vector2() },
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -10;
    this.scene.add(bg);

    // Stars
    const SC = this.isMobile ? 2000 : 4000;
    const sPos = new Float32Array(SC * 3);
    const sSeed = new Float32Array(SC);
    for (let i = 0; i < SC; i++) {
      const r = 60 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      sPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      sPos[i * 3 + 2] = r * Math.cos(ph);
      sSeed[i] = Math.random();
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("aSeed", new THREE.BufferAttribute(sSeed, 1));
    this.starMat = new THREE.ShaderMaterial({
      vertexShader: starVertex,
      fragmentShader: starFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pr } },
    });
    this.stars = new THREE.Points(sGeo, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    // Main particles
    const N = this.isMobile ? 16000 : 36000;
    const { rand, shapes } = buildShapes(N);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
    geo.setAttribute("aS1", new THREE.BufferAttribute(shapes[1], 3));
    geo.setAttribute("aS2", new THREE.BufferAttribute(shapes[2], 3));
    geo.setAttribute("aS3", new THREE.BufferAttribute(shapes[3], 3));
    geo.setAttribute("aS4", new THREE.BufferAttribute(shapes[4], 3));
    geo.setAttribute("aS5", new THREE.BufferAttribute(shapes[5], 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));

    this.mat = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFlow: { value: 0 },
        uProgress: { value: 0 },
        uSize: { value: this.isMobile ? 46 : 38 },
        uPixelRatio: { value: pr },
        uMouse: { value: new THREE.Vector3(999, 999, 999) },
        uMouseStrength: { value: 0 },
        uShockPos: { value: new THREE.Vector3() },
        uShockT: { value: 100 },
        uAudio: { value: 0 },
        uVelocity: { value: 0 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
        uBrightness: { value: this.isMobile ? 0.8 : 0.62 },
      },
    });
    const points = new THREE.Points(geo, this.mat);
    points.frustumCulled = false;
    this.scene.add(points);

    // Event horizon
    this.hole = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    this.hole.visible = false;
    this.scene.add(this.hole);

    // Post
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9,
      0.65,
      0.05
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener("resize", this.onResize);
    this.tick();
  }

  setProgress(p: number) {
    this.targetProgress = p;
  }
  setFinale(v: number) {
    this.finaleTarget = v;
  }
  setMouse(nx: number, ny: number) {
    this.mouseTarget.set(nx, ny);
  }
  addVelocity(v: number) {
    this.velTarget = Math.min(this.velTarget + v, 3);
  }
  shock(nx: number, ny: number) {
    this.mat.uniforms.uShockPos.value.copy(this.projectToFocus(new THREE.Vector2(nx, ny)));
    this.shockStart = this.clock.elapsedTime;
  }

  private projectToFocus(ndc: THREE.Vector2) {
    this.raycaster.setFromCamera(ndc, this.camera);
    const dir = this.camera.getWorldDirection(this.tmpA).negate();
    this.plane.setFromNormalAndCoplanarPoint(dir, this.look);
    const out = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.plane, out)) out.set(999, 999, 999);
    return out;
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.bgMat.uniforms.uRes.value.set(w, h);
  };

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // smoothing
    this.progress += (this.targetProgress - this.progress) * damp(3.2, dt);
    this.mouse.lerp(this.mouseTarget, damp(5, dt));
    this.velTarget *= Math.exp(-3.5 * dt);
    this.velocity += (this.velTarget - this.velocity) * damp(6, dt);
    this.finaleOutro += (this.finaleTarget - this.finaleOutro) * damp(2, dt);
    const audio = this.getAudioLevel();

    const p = Math.min(Math.max(this.progress, 0), 5);
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, 5);
    const f = p - i0;

    // Colors
    const u = this.mat.uniforms;
    u.uColorA.value.lerpColors(this.colors[i0][0], this.colors[i1][0], f);
    u.uColorB.value.lerpColors(this.colors[i0][1], this.colors[i1][1], f);
    this.bgMat.uniforms.uBgA.value.copy(u.uColorB.value).multiplyScalar(0.07);
    this.bgMat.uniforms.uBgB.value.copy(u.uColorA.value).multiplyScalar(0.11);

    // Camera
    const wide = window.innerWidth > 900 ? 1 : 0;
    const c0 = CAM[i0];
    const c1 = CAM[i1];
    const shift = (c0.shift + (c1.shift - c0.shift) * f) * wide;
    this.tmpA.set(...c0.pos);
    this.tmpB.set(...c1.pos);
    this.camPos.lerpVectors(this.tmpA, this.tmpB, f);
    this.tmpA.set(...c0.look);
    this.tmpB.set(...c1.look);
    this.look.lerpVectors(this.tmpA, this.tmpB, f);
    this.camPos.x += shift;
    this.look.x += shift;
    // finale pulls back
    this.camPos.z += this.finaleOutro * 6;
    // parallax
    this.camPos.x += this.mouse.x * 0.9;
    this.camPos.y += this.mouse.y * 0.6;
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.look);
    const tunnelW = Math.max(0, 1 - Math.abs(p - 2) * 1.5);
    this.camera.rotation.z += Math.sin(t * 0.3) * 0.02 + tunnelW * Math.sin(t * 0.5) * 0.06;
    const targetFov = 55 + Math.min(this.velocity, 2) * 14 + tunnelW * 10;
    this.camera.fov += (targetFov - this.camera.fov) * damp(4, dt);
    this.camera.updateProjectionMatrix();

    // Mouse in world
    this.mouseActive += ((this.mouseTarget.lengthSq() > 0 ? 1 : 0) - this.mouseActive) * damp(2, dt);
    u.uMouse.value.copy(this.projectToFocus(this.mouse));
    u.uMouseStrength.value = this.mouseActive;

    // Flow
    this.flow += dt * (10 + this.velocity * 45);

    u.uTime.value = t;
    u.uFlow.value = this.flow;
    u.uProgress.value = p;
    u.uAudio.value = audio;
    u.uVelocity.value = this.velocity;
    u.uShockT.value = t - this.shockStart;

    this.bgMat.uniforms.uTime.value = t;
    this.bgMat.uniforms.uMouse.value.copy(this.mouse);
    this.starMat.uniforms.uTime.value = t;
    this.stars.rotation.y = t * 0.006 + p * 0.25;
    this.stars.rotation.x = p * 0.08;

    // Black hole
    const hw = Math.max(0, 1 - Math.abs(p - 3) * 1.6);
    this.hole.visible = hw > 0.01;
    this.hole.scale.setScalar(Math.max(hw, 0.001));

    this.bloom.strength = 0.85 + Math.min(this.velocity, 2) * 0.5 + audio * 0.9 + hw * 0.35;

    this.onFrame?.(this.velocity);
    this.composer.render();
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.composer.dispose();
    this.renderer.dispose();
  }
}
