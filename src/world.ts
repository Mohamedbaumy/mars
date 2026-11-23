// The Mars city as it stands after ep6, built with the same toon kit as the videos (MarsKit.ts is a copy of
// mansa/video/src/MarsKit.ts). Layout matches MarsCity6.tsx: district 1 = rings 2–3 of a 7×7 grid around the doctor's
// dome, its last plot is the golden gate; district 2 = a 5×5 grid beyond the gate with an obelisk in the middle.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { paintGround, tex, toon, flat, mesh, rng, V, OL } from './MarsKit';
import { RESIDENTS } from './residents';

export const S = 4.2;
type P = { x: number; z: number };

// district 1
const PLOTS: (P & { ring: number })[] = [];
for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const ring = Math.max(Math.abs(i), Math.abs(j)); if (ring >= 2) PLOTS.push({ x: i * S, z: j * S, ring }); }
const order = (p: P & { ring: number }) => (p.ring - 2) * 10 + ((Math.atan2(p.x, p.z) + Math.PI * 2 - 0.6) % (Math.PI * 2));
PLOTS.sort((a, b) => order(a) - order(b));
export const GATE_AT = PLOTS[39];
// district 2
export const C2 = V(GATE_AT.x, 0, GATE_AT.z + 5 * S);
const D2: P[] = [];
for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i || j) D2.push({ x: C2.x + i * S, z: C2.z + j * S });
D2.sort((a, b) => (a.z - b.z) * 10 + Math.abs(a.x - C2.x) - Math.abs(b.x - C2.x));

export const DOC = V(0, 0, -2.4), PAD = V(0, 0, 3.4);
const d1 = RESIDENTS.filter((r) => r.d === 1), d2 = RESIDENTS.filter((r) => r.d === 2);
export const HOMES = RESIDENTS.map((r) => {
  const p = r.d === 1 ? PLOTS[d1.indexOf(r)] : D2[d2.indexOf(r)];
  return { r, pos: V(p.x, 0, p.z), d: r.d };
});
export const FREE = D2.slice(d2.length).map((p) => V(p.x, 0, p.z));

function cv(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!]; }
const ctex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
export function halo(col: string) {
  const [c, g] = cv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, col + 'cc'); gr.addColorStop(0.35, col + '55'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return ctex(c);
}
function qmark() {
  const [c, g] = cv(128, 128); g.fillStyle = '#ffd23f'; g.strokeStyle = '#1b1210'; g.lineWidth = 9;
  g.beginPath(); g.arc(64, 64, 52, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#1b1210'; g.font = '900 78px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('؟', 64, 70);
  return ctex(c);
}
function stars() {
  const [c, g] = cv(1024, 512), r = rng(77); g.fillStyle = '#140b24'; g.fillRect(0, 0, 1024, 512);
  const gr = g.createLinearGradient(0, 300, 0, 512); gr.addColorStop(0, 'rgba(120,50,70,0)'); gr.addColorStop(1, 'rgba(150,70,80,.9)'); g.fillStyle = gr; g.fillRect(0, 300, 1024, 212);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; g.fillRect(r() * 1024, r() * 380, 1 + r() * 1.6, 1 + r() * 1.6); }
  return ctex(c);
}
function star5(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill();
}
export function flagCanvas(code: string) {
  const [c, g] = cv(256, 160); const bands = (cols: string[]) => cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 160 / cols.length, 256, 160 / cols.length + 1); });
  if (code === 'eg') { bands(['#ce1126', '#ffffff', '#000000']); g.fillStyle = '#c09300'; g.beginPath(); g.ellipse(128, 80, 16, 20, 0, 0, 7); g.fill(); }
  if (code === 'iq') { bands(['#ce1126', '#ffffff', '#000000']); g.fillStyle = '#007a3d'; g.font = '900 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('الله أكبر', 128, 82); }
  if (code === 'sy') { bands(['#007a3d', '#ffffff', '#000000']); g.fillStyle = '#ce1126'; [80, 128, 176].forEach((x) => star5(g, x, 80, 19)); }
  if (code === 'ps') { bands(['#000000', '#ffffff', '#007a3d']); g.fillStyle = '#ce1126'; g.beginPath(); g.moveTo(0, 0); g.lineTo(110, 80); g.lineTo(0, 160); g.fill(); }
  if (code === 'ye') bands(['#ce1126', '#ffffff', '#000000']);
  if (code === 'sa') {
    g.fillStyle = '#006c35'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#ffffff'; g.font = '900 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('لا إله إلا الله', 128, 52); g.fillText('محمد رسول الله', 128, 88); g.fillRect(60, 116, 140, 6); g.fillRect(190, 110, 6, 18);
  }
  return c;
}

function buildDome(p: THREE.Object3D, r: number, body: string, glow: string, band?: string) {
  const g = new THREE.Group(); p.add(g);
  mesh(g, new THREE.CylinderGeometry(r * 1.08, r * 1.12, 0.22, 36), toon('#8c8f9c'), [0, 0.11, 0]);
  mesh(g, new THREE.SphereGeometry(r, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), toon(body), [0, 0.2, 0]);
  if (band) mesh(g, new THREE.TorusGeometry(r * 0.93, r * 0.07, 8, 40), toon(band), [0, 0.2 + r * 0.38, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const win = flat(glow);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.45, e = 0.42, R = r * 1.005;
    const w = mesh(g, new THREE.CircleGeometry(r * 0.16, 20), win, [Math.sin(a) * Math.cos(e) * R, 0.2 + Math.sin(e) * R, Math.cos(a) * Math.cos(e) * R], [1, 1, 1], [0, 0, 0], false);
    w.lookAt(w.position.clone().multiplyScalar(2).setY(w.position.y * 2 - 0.2));
  }
  mesh(g, new RoundedBoxGeometry(r * 0.5, r * 0.62, r * 0.5, 3, r * 0.08), toon('#c9ced8'), [0, 0.2 + r * 0.31, r * 0.86]);
  mesh(g, new THREE.PlaneGeometry(r * 0.3, r * 0.44), win, [0, 0.2 + r * 0.25, r * 1.115], [1, 1, 1], [0, 0, 0], false);
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(glow), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
  h.position.set(0, 0.4, r * 1.3); h.scale.set(r * 3.2, r * 1.6, 1); g.add(h);
  return g;
}
function buildFlag(root: THREE.Object3D, x: number, z: number, code: string) {
  const g = new THREE.Group(); g.position.set(x, 1.4, z); g.scale.setScalar(2.3); root.add(g);
  mesh(g, new THREE.CylinderGeometry(0.05, 0.06, 2.4, 8), toon('#e9eef5'), [0, 1.2, 0]);
  mesh(g, new THREE.SphereGeometry(0.1, 10, 8), flat('#ffd23f'), [0, 2.45, 0], [1, 1, 1], [0, 0, 0], false);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94, 12, 1), OL(new THREE.MeshBasicMaterial({ map: ctex(flagCanvas(code)), side: THREE.DoubleSide }), true, 0.004));
  cloth.position.set(0.77, 1.9, 0); g.add(cloth);
  return cloth;
}
export const wave = (cloth: THREE.Mesh, t: number, i: number) => { const cp = cloth.geometry.attributes.position as THREE.BufferAttribute; for (let n = 0; n < cp.count; n++) { const x = (n % 13) / 12; cp.setZ(n, Math.sin(x * 5 - t * 10.5 + i) * 0.12 * x); } cp.needsUpdate = true; };

function streets(root: THREE.Object3D, cx: number, cz: number, half: number) {
  const street = toon('#5b4048', undefined, false), dash = flat('#ffd98a'), len = S * half * 2;
  for (let k = -half; k <= half; k++) {
    mesh(root, new THREE.PlaneGeometry(0.9, len), street, [cx + k * S, 0.02, cz], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
    mesh(root, new THREE.PlaneGeometry(len, 0.9), street, [cx, 0.021, cz + k * S], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
    const n = Math.floor(len / 2.4);
    for (let m = -n; m <= n; m++) { mesh(root, new THREE.PlaneGeometry(0.08, 0.5), dash, [cx + k * S, 0.03, cz + m * 1.2], [1, 1, 1], [-Math.PI / 2, 0, 0], false); mesh(root, new THREE.PlaneGeometry(0.5, 0.08), dash, [cx + m * 1.2, 0.03, cz + k * S], [1, 1, 1], [-Math.PI / 2, 0, 0], false); }
  }
}
function lamp(root: THREE.Object3D, x: number, z: number, lampH: THREE.Texture, post: THREE.Material, bulb: THREE.Material) {
  mesh(root, new THREE.CylinderGeometry(0.04, 0.05, 1.3, 6), post, [x, 0.65, z]);
  mesh(root, new THREE.SphereGeometry(0.12, 10, 8), bulb, [x, 1.35, z], [1, 1, 1], [0, 0, 0], false);
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampH, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 })); h.position.set(x, 1.3, z); h.scale.set(2.4, 2.4, 1); root.add(h);
}

export function buildWorld(scene: THREE.Scene) {
  const root = new THREE.Group(); scene.add(root);
  root.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: stars(), side: THREE.BackSide, fog: false })));
  const gt = tex(paintGround(7, '#7a3524', '#4e1f16', '#9a4a32'), 30, 30);
  mesh(root, new THREE.PlaneGeometry(400, 400), toon('#ffffff', gt, false), [0, 0, 0], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  const ht = tex(paintGround(11, '#5e2a1e', '#3a1610', '#7a3826'), 3, 2), hr = rng(5);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + hr() * 0.3, d = 64 + hr() * 26; mesh(root, new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#ffffff', ht), [Math.cos(a) * d + 4, -0.5, Math.sin(a) * d + 16], [10 + hr() * 12, 3 + hr() * 6, 8 + hr() * 8], [0, hr() * 3, 0], false); }
  const rr = rng(9), rock = toon('#5a2618', ht);
  const busy = (x: number, z: number) => Math.max(Math.abs(x), Math.abs(z)) < 17.5 || (Math.abs(x - C2.x) < 13.5 && z > GATE_AT.z - 1 && z < C2.z + 13.5);
  for (let i = 0; i < 90; i++) { const x = (rr() - 0.5) * 100, z = (rr() - 0.5) * 100 + 16; if (busy(x, z)) continue; const s = 0.25 + rr() ** 2 * 1.4; mesh(root, new THREE.DodecahedronGeometry(1, 0), rock, [x, s * 0.3, z], [s, s * 0.7, s * 0.9], [rr() * 3, rr() * 3, rr() * 3]); }

  // district 1
  mesh(root, new THREE.PlaneGeometry(S * 7 + 1.2, S * 7 + 1.2), toon('#a8614a', undefined, false), [0, 0.01, 0], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  streets(root, 0, 0, 3.5);
  const post = toon('#3a3442'), bulb = flat('#ffe2a0'), lampH = halo('#ffc070');
  for (let i = -3.5; i <= 3.5; i += 1) for (let j = -3.5; j <= 3.5; j += 1) { if ((Math.round(i * 2) + Math.round(j * 2)) % 4 !== 0) continue; lamp(root, i * S + 0.55, j * S + 0.55, lampH, post, bulb); }
  const doc = buildDome(root, 2.3, '#f4f1ea', '#ffcf7a', '#e0402e'); doc.position.copy(DOC);
  mesh(root, new THREE.CylinderGeometry(2.1, 2.1, 0.08, 40), toon('#6c6f7c'), [PAD.x, 0.04, PAD.z]);
  mesh(root, new THREE.TorusGeometry(1.75, 0.07, 6, 40), flat('#ffd23f'), [PAD.x, 0.1, PAD.z], [1, 1, 1], [Math.PI / 2, 0, 0], false);

  // homes (band colour = the wave they arrived in, as in the videos)
  const glows = ['#ffcf7a', '#ffd9a0', '#ffc46a'];
  const cloths: THREE.Mesh[] = [];
  HOMES.forEach(({ pos, d, r }, k) => {
    const i1 = k;   // index in plot order
    const center = d === 1 ? V(0, 0, 0) : C2;
    const band = d === 2 ? '#5be38a' : i1 === 0 ? '#ffd23f' : i1 >= 15 ? '#3fc1ff' : i1 >= 10 ? '#ff8a2a' : undefined;
    const dm = buildDome(root, 1.25, d === 2 ? '#eef7ee' : i1 === 0 ? '#fff4d6' : '#e9eef5', glows[k % 3], band);
    dm.position.copy(pos); dm.rotation.y = Math.atan2(-(pos.x - center.x), -(pos.z - center.z)) + Math.PI;
    if (r.f) cloths.push(buildFlag(root, pos.x, pos.z, r.f));
  });

  // the gate
  const gate = new THREE.Group(); gate.position.set(GATE_AT.x, 0, GATE_AT.z); root.add(gate);
  const gold = toon('#ffc93c'), stone = toon('#efe6d2');
  [-1.75, 1.75].forEach((x) => { mesh(gate, new RoundedBoxGeometry(0.7, 4.2, 0.9, 3, 0.1), stone, [x, 2.1, 0]); mesh(gate, new THREE.BoxGeometry(0.9, 0.3, 1.1), gold, [x, 0.15, 0]); mesh(gate, new THREE.BoxGeometry(0.85, 0.25, 1.05), gold, [x, 4.25, 0]); });
  mesh(gate, new THREE.TorusGeometry(1.75, 0.38, 12, 40, Math.PI), stone, [0, 4.2, 0]);
  mesh(gate, new THREE.TorusGeometry(1.75, 0.14, 8, 40, Math.PI), gold, [0, 4.2, 0.48]);
  mesh(gate, new THREE.SphereGeometry(0.32, 14, 10), gold, [0, 6.35, 0]);
  const portalM = new THREE.MeshBasicMaterial({ color: '#ffe7a0', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  mesh(gate, new THREE.CircleGeometry(1.4, 40, 0, Math.PI), portalM, [0, 4.2, 0], [1, 1, 1], [0, 0, 0], false);
  mesh(gate, new THREE.PlaneGeometry(2.8, 4.2), portalM, [0, 2.1, 0], [1, 1, 1], [0, 0, 0], false);
  const gH = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('#ffd27a'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 })); gH.position.set(GATE_AT.x, 3.4, GATE_AT.z); gH.scale.set(12, 10, 1); root.add(gH);

  // the road + district 2
  const roadLen = C2.z - 2.5 * S - (GATE_AT.z + 1.4);
  mesh(root, new THREE.PlaneGeometry(2.2, roadLen + 1), toon('#5b4048', undefined, false), [GATE_AT.x, 0.025, GATE_AT.z + 1.4 + roadLen / 2], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  for (let m = 0; m <= 3; m++) { const z = GATE_AT.z + 2.4 + m * roadLen / 3.2; lamp(root, GATE_AT.x - 1.5, z, lampH, post, bulb); lamp(root, GATE_AT.x + 1.5, z, lampH, post, bulb); }
  mesh(root, new THREE.PlaneGeometry(S * 5 + 1.2, S * 5 + 1.2), toon('#a8614a', undefined, false), [C2.x, 0.012, C2.z], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  streets(root, C2.x, C2.z, 2.5);
  for (let i = -2.5; i <= 2.5; i += 1) for (let j = -2.5; j <= 2.5; j += 1) { if ((Math.round(i * 2) + Math.round(j * 2)) % 4 !== 0) continue; lamp(root, C2.x + i * S + 0.55, C2.z + j * S + 0.55, lampH, post, bulb); }
  mesh(root, new THREE.CylinderGeometry(1.4, 1.6, 0.25, 24), stone, [C2.x, 0.12, C2.z]);
  mesh(root, new THREE.ConeGeometry(0.45, 3.2, 4), gold, [C2.x, 1.85, C2.z]);

  // free plots: stakes + «؟»
  const stake = toon('#e9d6a0'), rope = toon('#ffd23f', undefined, false), qT = qmark();
  const qs = FREE.map((p) => {
    const a = 1.25, P = [[-a, -a], [a, -a], [a, a], [-a, a]];
    P.forEach(([dx, dz]) => mesh(root, new THREE.CylinderGeometry(0.05, 0.06, 0.6, 6), stake, [p.x + dx, 0.3, p.z + dz]));
    P.forEach(([ax, az], k) => { const [bx, bz] = P[(k + 1) % 4]; mesh(root, new THREE.CylinderGeometry(0.02, 0.02, 2 * a, 5), rope, [p.x + (ax + bx) / 2, 0.5, p.z + (az + bz) / 2], [1, 1, 1], [0, -Math.atan2(bz - az, bx - ax), Math.PI / 2], false); });
    const q = new THREE.Sprite(new THREE.SpriteMaterial({ map: qT, transparent: true, depthWrite: false })); q.position.set(p.x, 1.1, p.z); q.scale.setScalar(0.9); root.add(q);
    return q;
  });

  // highlight beam for the searched dome
  const beam = mesh(root, new THREE.CylinderGeometry(1.5, 1.7, 40, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), [0, 20, 0], [1, 1, 1], [0, 0, 0], false);
  return { cloths, qs, beam };
}
