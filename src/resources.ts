// Resources: each facility supports `cap` residents. Every new commenter is one more mouth, so the city slides into
// shortages as it grows, and each shortage is an episode hook (water → reach the ice lake, food → a new greenhouse).
// Edit `cap` when an episode builds or upgrades a facility.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toon, flat, mesh, V, OL } from './MarsKit';

export type Res = { key: string; icon: string; name: string; fac: string; cap: number; at: THREE.Vector3; tag: THREE.Vector3; fix: string; v?: string };
export const RES: Res[] = [
  { key: 'water', icon: '💧', name: 'المية', fac: 'خزان المية', v: 'بيكفّي بعد الماسورة', cap: 80, at: V(-10, 0, 47), tag: V(-10, 6.2, 47), fix: 'الحلقة ٧: الماسورة وصلت من بحيرة الجليد 🧊' },
  { key: 'oxygen', icon: '🫧', name: 'الأكسجين', fac: 'مولّد الأكسجين', cap: 70, at: V(23, 0, -4), tag: V(23, 7.4, -4), fix: '' },
  { key: 'food', icon: '🌱', name: 'الأكل', fac: 'الصوب الزراعية', v: 'بتكفّي', cap: 50, at: V(-10, 0, 32), tag: V(-10, 4, 32), fix: 'محتاجين صوبة جديدة… والصوبة محتاجة مية!' },
  { key: 'power', icon: '⚡', name: 'الكهربا', fac: 'مزرعة الطاقة الشمسية', v: 'بتكفّي', cap: 90, at: V(0, 0, -25), tag: V(0, 3.6, -25), fix: '' },
];
export const FAC_ZONES = [
  { x: -10, z: 39.5, hw: 5, hd: 13 },    // greenhouses + water tank
  { x: 23, z: -4, hw: 6, hd: 6 },        // oxygen plant
  { x: 0, z: -25, hw: 13, hd: 6 },       // solar farm
  ];
export const onFacility = (x: number, z: number) => FAC_ZONES.some((f) => Math.abs(x - f.x) < f.hw + 1.5 && Math.abs(z - f.z) < f.hd + 1.5);

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function halo(col: string) {
  return canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, col + 'ff'); gr.addColorStop(0.3, col + '66'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
}

export function buildFacilities(root: THREE.Object3D, residents: number) {
  const metal = toon('#c9ced8'), dark = toon('#3a3442'), white = toon('#eef1f6');

  // ⚡ solar farm: 4 rows of tilted panels on posts
  const cell = canvasTex(64, 40, (g) => { g.fillStyle = '#23407e'; g.fillRect(0, 0, 64, 40); g.strokeStyle = '#7fa6e6'; g.lineWidth = 1.5; for (let x = 0; x <= 64; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 40); g.stroke(); } for (let y = 0; y <= 40; y += 13.3) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); } });
  const panelM = OL(new THREE.MeshToonMaterial({ color: '#ffffff', map: cell }), true, 0.004);
  const sp = RES[3].at;
  for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) {
    const x = sp.x - 10.5 + k * 3.5, z = sp.z - 3.4 + row * 3.4;
    mesh(root, new THREE.CylinderGeometry(0.06, 0.06, 0.8, 5), dark, [x, 0.4, z]);
    mesh(root, new THREE.BoxGeometry(3, 0.08, 1.8), panelM, [x, 0.85, z], [1, 1, 1], [-0.45, 0, 0]);
  }

  // 🫧 oxygen plant: three tall tanks, a hall, pipes and a blinking beacon
  const op = RES[1].at;
  [-2.2, 0, 2.2].forEach((dx, i) => {
    mesh(root, new THREE.CylinderGeometry(0.9, 0.9, 4.6, 20), white, [op.x + dx, 2.3, op.z - 1.6]);
    mesh(root, new THREE.SphereGeometry(0.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), white, [op.x + dx, 4.6, op.z - 1.6]);
    mesh(root, new THREE.CylinderGeometry(0.93, 0.93, 0.35, 20), toon('#3fc1ff'), [op.x + dx, 2.6 + i * 0.3, op.z - 1.6]);
  });
  mesh(root, new RoundedBoxGeometry(6.4, 1.8, 2.6, 3, 0.2), metal, [op.x, 0.9, op.z + 1.4]);
  mesh(root, new THREE.CylinderGeometry(0.12, 0.12, 6.4, 8), toon('#ffd23f'), [op.x, 1.9, op.z + 0.1], [1, 1, 1], [0, 0, Math.PI / 2]);
  mesh(root, new THREE.CylinderGeometry(0.25, 0.3, 3, 10), dark, [op.x + 2.6, 2.4, op.z + 1.6]);
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('#7fe0ff'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  beacon.position.set(op.x + 2.6, 4.2, op.z + 1.6); beacon.scale.setScalar(2.6); root.add(beacon);

  // 🌱 greenhouses: three glass tunnels with rows of plants
  const gp = RES[2].at, glass = OL(new THREE.MeshToonMaterial({ color: '#b8f5c8', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }), true, 0.004);
  const leaf = toon('#3fbf5a'), soil = toon('#5b3326', undefined, false);
  [-4.2, 0, 4.2].forEach((dz) => {
    const z = gp.z + dz;
    mesh(root, new THREE.PlaneGeometry(3.4, 3.6), soil, [gp.x, 0.03, z], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) mesh(root, new THREE.ConeGeometry(0.28, 0.7, 6), leaf, [gp.x + a * 1.05, 0.35, z + b * 1.05]);
    mesh(root, new THREE.CylinderGeometry(1.7, 1.7, 3.6, 24, 1, true, -Math.PI / 2, Math.PI), glass, [gp.x, 0, z], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  });

  // 💧 water tank with a level gauge (shows cap / residents); the pipe to the ice lake is built in world.ts (ep7)
  const wp = RES[0].at;
  mesh(root, new THREE.CylinderGeometry(2.3, 2.3, 4.2, 28), metal, [wp.x, 2.1, wp.z]);
  mesh(root, new THREE.CylinderGeometry(2.4, 2.4, 0.25, 28), dark, [wp.x, 4.25, wp.z]);
  const lvl = Math.min(1, RES[0].cap / residents);
  mesh(root, new THREE.PlaneGeometry(0.7, 3.6), dark, [wp.x, 2.1, wp.z + 2.32], [1, 1, 1], [0, 0, 0], false);
  mesh(root, new THREE.PlaneGeometry(0.5, 3.4 * lvl), flat(lvl < 1 ? '#ff5a3c' : '#3fc1ff'), [wp.x, 0.4 + 1.7 * lvl, wp.z + 2.34], [1, 1, 1], [0, 0, 0], false);
  return { beacon };
}
