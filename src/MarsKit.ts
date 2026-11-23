// Shared three.js toon helpers for the Mars comps (no web fonts here, so comps can render offline).
import * as THREE from 'three';

export const W = 1080, H = 1920;
// ---------------- helpers ----------------
export const rng = (seed: number) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const sm = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const canvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!]; };
export const tex = (c: HTMLCanvasElement, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// painted ground: base + soft patches + speckle pebbles + hairline cracks (deterministic)
export function paintGround(seed: number, base: string, dark: string, light: string) {
  const [c, g] = canvas(1024, 1024), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) {
    const x = r() * 1024, y = r() * 1024, rad = 40 + r() * 140;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); const col = r() < 0.55 ? dark : light;
    gr.addColorStop(0, col + '55'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.6 ? dark + 'aa' : light + '99'; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 1 + r() * 3.2, 1 + r() * 2.2, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = dark + '88'; g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let x = r() * 1024, y = r() * 1024; g.lineWidth = 1 + r() * 1.6; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; g.lineTo(x, y); } g.stroke();
  }
  return c;
}
export function paintSky() {
  const [c, g] = canvas(16, 512); const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#3a1f3a'); gr.addColorStop(0.32, '#7a3540'); gr.addColorStop(0.47, '#d58a62'); gr.addColorStop(0.5, '#f0b886'); gr.addColorStop(1, '#f0b886');
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function paintDust() {
  const [c, g] = canvas(256, 128); const gr = g.createRadialGradient(128, 64, 0, 128, 64, 120);
  gr.addColorStop(0, 'rgba(255,214,170,.55)'); gr.addColorStop(1, 'rgba(255,214,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export const RAMP = (() => { const t = new THREE.DataTexture(new Uint8Array([105, 105, 190, 190, 255, 255]).filter((_, i) => i % 2 === 0), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
export const OL = (m: THREE.Material, on = true, thick = 0.0065) => { m.userData.outlineParameters = { visible: on, thickness: thick, color: [0.05, 0.03, 0.04] }; return m; };
export const toon = (c: number | string, map?: THREE.Texture, on = true, thick = 0.0065) => OL(new THREE.MeshToonMaterial({ color: c, gradientMap: RAMP, ...(map ? { map } : {}) }), on, thick);
export const ctoon = (c: string) => toon(c, undefined, true, 0.0095);   // characters: bolder ink
export const flat = (c: number | string) => OL(new THREE.MeshBasicMaterial({ color: c }), false);

export type V3 = [number, number, number];
export const mesh = (p: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: V3 = [0, 0, 0], sc: V3 = [1, 1, 1], rot: V3 = [0, 0, 0], shadow = true) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.scale.set(...sc); m.rotation.set(...rot); m.castShadow = shadow; m.receiveShadow = true; p.add(m); return m;
};

