// Terrain around the city = the challenges ahead. Each landmark is a future episode hook: the canyon blocks expansion
// east, the crater hides something, the volcano sleeps, the ice is the first water but far away.
// The ground is a Shape with holes so the canyon and the crater really go down below the surface.
import * as THREE from 'three';
import { paintGround, tex, toon, flat, mesh, rng, V, OL } from './MarsKit';

export type Challenge = { key: string; title: string; desc: string; at: THREE.Vector3; tag: THREE.Vector3; view: number; low?: boolean };
export const CHALLENGES: Challenge[] = [
  { key: 'canyon', title: '🔒 الوادي العظيم', desc: 'عمقه مش باين… والحي التالت لازم يعدّيه. نبني كوبري؟ ولا ننزل جوّه؟', at: V(39, 0, 14), tag: V(39, 3, 14), view: 70 },
  { key: 'crater', title: '🔒 فوهة النيزك', desc: 'نيزك وقع هنا من زمان… ولسه فيه حاجة بتلمع في القاع.', at: V(-42, 0, 18), tag: V(-42, 5, 18), view: 50 },
  { key: 'volcano', title: '🔒 البركان النايم', desc: 'نايم من مليون سنة… بس الأرض بدأت تسخن.', at: V(-6, 0, -66), tag: V(-6, 17, -66), view: 95, low: true },
  { key: 'ice', title: '🧊 بحيرة الجليد', desc: 'أول مية على المريخ! ماسورة بتوصّلها للمدينة، وجنبها أول ٤ سكان: جاد وسهيلا ويوسف وفوفو.', at: V(-24, 0, 76), tag: V(-24, 4, 76), view: 46 },
];

// canyon edges: a gentle meander, 10 units wide, running north–south past the east side of the city
const CANYON_W = 10, CANYON_D = 8;
export const canyonL = (z: number) => 34 + Math.sin(z / 14) * 3 + Math.sin(z / 37) * 4;
const CRATER = { x: -42, z: 18, r: 11 };

export function buildGround(root: THREE.Object3D) {
  const shape = new THREE.Shape();
  shape.moveTo(-700, -700); shape.lineTo(700, -700); shape.lineTo(700, 700); shape.lineTo(-700, 700); shape.closePath();
  // shape y = -world z (the shape is laid flat with rotation.x = -PI/2)
  const zs: number[] = []; for (let z = -690; z <= 690; z += 3) zs.push(z);
  const canyon = new THREE.Path();
  zs.forEach((z, i) => (i ? canyon.lineTo(canyonL(z), -z) : canyon.moveTo(canyonL(z), -z)));
  [...zs].reverse().forEach((z) => canyon.lineTo(canyonL(z) + CANYON_W, -z));
  canyon.closePath();
  const crater = new THREE.Path(); crater.absarc(CRATER.x, -CRATER.z, CRATER.r, 0, Math.PI * 2, true);
  shape.holes.push(canyon, crater);
  const gt = paintGround(7, '#7a3524', '#4e1f16', '#9a4a32');
  const t = tex(gt, 30 / 400, 30 / 400);
  const g = mesh(root, new THREE.ShapeGeometry(shape, 24), toon('#ffffff', t, false), [0, 0, 0], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  g.receiveShadow = true;
  return t;
}

export function buildTerrain(root: THREE.Object3D, avoid: { x: number; z: number }[] = []) {
  const r = rng(404);
  const ht = tex(paintGround(19, '#6a2c1e', '#3f1710', '#8a4430'), 2, 2);

  // ---- the canyon: banded walls + dark floor + a few rock pillars
  const zs: number[] = []; for (let z = -690; z <= 690; z += 3) zs.push(z);
  const wall = (side: 0 | 1) => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    zs.forEach((z, i) => {
      const x = canyonL(z) + side * CANYON_W;
      pos.push(x, 0.02, z, x + (side ? -1 : 1) * 0.9, -CANYON_D, z);
      uv.push(z / 12, 1, z / 12, 0);
      if (i) { const a = (i - 1) * 2; side ? idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) : idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  const bands = (() => {
    const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d')!;
    const cols = ['#9a4a32', '#7a3524', '#b0583a', '#5e2a1e', '#8a4430', '#4e1f16', '#6a2c1e', '#3a1610'];
    cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 32, 8, 33); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
  })();
  const wallM = OL(new THREE.MeshToonMaterial({ color: '#ffffff', map: bands, side: THREE.DoubleSide }), false);
  [0, 1].forEach((s) => { const m = new THREE.Mesh(wall(s as 0 | 1), wallM); root.add(m); });
  mesh(root, new THREE.PlaneGeometry(60, 1400), toon("#4a1f15", undefined, false), [38, -CANYON_D, 0], [1, 1, 1], [-Math.PI / 2, 0, 0], false);
  const rock = toon('#5a2618', ht);
  for (let i = 0; i < 14; i++) { const z = -60 + i * 11 + r() * 5, x = canyonL(z) + 2 + r() * (CANYON_W - 4), h = 2 + r() * 4; mesh(root, new THREE.CylinderGeometry(0.5 + r() * 0.6, 1 + r() * 0.8, h, 6), rock, [x, -CANYON_D + h / 2, z], [1, 1, 1], [0, r() * 3, 0]); }
  for (let i = 0; i < 60; i++) { const z = -120 + r() * 240, side = r() < 0.5 ? 0 : 1, x = canyonL(z) + side * CANYON_W + (side ? 1 : -1) * (0.8 + r() * 3), s = 0.3 + r() * 0.9; mesh(root, new THREE.DodecahedronGeometry(1, 0), rock, [x, s * 0.3, z], [s, s * 0.7, s], [r() * 3, r() * 3, r() * 3]); }

  // ---- the crater: a lathe bowl dropping through the hole + a raised rim, something glinting at the bottom
  const prof = [[0, -4.2], [5, -3.9], [8.5, -2.6], [10.4, -0.9], [11, 0.05], [12.2, 1.9], [13.3, 2.6], [15, 1.6], [18, 0.4], [21, 0.02]].reverse().map(([x, y]) => new THREE.Vector2(x, y));
  const cm = toon('#ffd2b8', ht); cm.side = THREE.DoubleSide; mesh(root, new THREE.LatheGeometry(prof, 64), cm, [CRATER.x, 0, CRATER.z]);
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow('#8fe9ff'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
  glint.position.set(CRATER.x + 2, -3.2, CRATER.z - 1.5); glint.scale.setScalar(4); root.add(glint);
  mesh(root, new THREE.OctahedronGeometry(0.8, 0), flat('#bff4ff'), [CRATER.x + 2, -3.6, CRATER.z - 1.5], [1, 1.6, 1], [0.3, 0.5, 0.2]);

  // ---- the volcano: a broad lathe cone with a caldera, a faint warm glow inside
  const vp = [[0, 9.5], [4.5, 10], [5.5, 15.5], [7.5, 15], [16, 10], [28, 4.5], [38, 1.2], [46, 0.02]].reverse().map(([x, y]) => new THREE.Vector2(x, y));
  const vc = CHALLENGES[2].at;
  const vm = toon('#ffffff', ht); vm.side = THREE.DoubleSide; mesh(root, new THREE.LatheGeometry(vp, 72), vm, [vc.x, 0, vc.z]);
  const lava = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow('#ff6a2a'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
  lava.position.set(vc.x, 12, vc.z); lava.scale.set(16, 8, 1); root.add(lava);
  mesh(root, new THREE.CircleGeometry(4.6, 32), flat('#ff7a32'), [vc.x, 9.6, vc.z], [1, 1, 1], [-Math.PI / 2, 0, 0], false);

  // ---- the ice lake: a frozen disc, cracked, with ice blocks around it
  const ic = CHALLENGES[3].at;
  const iceT = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
    g.fillStyle = '#cdeefc'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#ffffff'; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) { g.beginPath(); let x = r() * 256, y = r() * 256; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  mesh(root, new THREE.CircleGeometry(12, 48), OL(new THREE.MeshToonMaterial({ color: '#ffffff', map: iceT }), false), [ic.x, 0.05, ic.z], [1.3, 1, 1], [-Math.PI / 2, 0, 0], false);
  const ice = toon('#e6f7ff');
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, d = 13 + r() * 7, s = 0.6 + r() * 1.8, bx = ic.x + Math.cos(a) * d * 1.3, bz = ic.z + Math.sin(a) * d; if (avoid.some((p) => Math.hypot(p.x - bx, p.z - bz) < 3.4)) continue; mesh(root, new THREE.DodecahedronGeometry(1, 0), ice, [ic.x + Math.cos(a) * d * 1.3, s * 0.4, ic.z + Math.sin(a) * d], [s, s * (0.8 + r()), s], [r() * 3, r() * 3, r() * 3]); }

  return { glint, lava };
}

function glow(col: string) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, col + 'ff'); gr.addColorStop(0.3, col + '66'); gr.addColorStop(1, col + '00');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// keep scattered rocks / hills off the landmarks
export const onTerrain = (x: number, z: number) =>
  (x > canyonL(z) - 3 && x < canyonL(z) + CANYON_W + 3) ||
  Math.hypot(x - CRATER.x, z - CRATER.z) < 23 ||
  Math.hypot(x - CHALLENGES[2].at.x, z - CHALLENGES[2].at.z) < 48 ||
  Math.hypot(x - CHALLENGES[3].at.x, z - CHALLENGES[3].at.z) < 24;
