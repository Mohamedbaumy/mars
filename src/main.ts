import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { buildWorld, wave, HOMES, FREE, DOC, GATE_AT, C2, flagCanvas } from './world';
import { RESIDENTS } from './residents';

const GOAL = 100;
const CHANNEL = 'https://www.youtube.com/@e7na3almareekh/shorts';
const ar = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;

// ---------------- renderer / scene ----------------
const canvas = $<HTMLCanvasElement>('#c');
const gl = new THREE.WebGLRenderer({ canvas, antialias: true });
gl.setPixelRatio(Math.min(devicePixelRatio, 2));
gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.setClearColor('#140b24');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#2a1430', 70, 190);
const W = buildWorld(scene);
scene.add(new THREE.HemisphereLight('#a99ad8', '#4a1e16', 1.35));
const moon = new THREE.DirectionalLight('#d6dcff', 1.5); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 180 }); moon.shadow.bias = -0.0004; moon.shadow.radius = 3;
moon.position.set(-18, 44, 30); moon.target.position.set(4, 0, 18); scene.add(moon, moon.target);
const fx = new OutlineEffect(gl, { defaultThickness: 0.0055, defaultColor: [0.05, 0.03, 0.06] });

const cam = new THREE.PerspectiveCamera(40, 1, 0.5, 600);
const controls = new OrbitControls(cam, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = 1.3; controls.minDistance = 7; controls.maxDistance = 150;
const HOME_T = new THREE.Vector3(5, 0, 18);
function overview() {
  const portrait = innerHeight > innerWidth;
  cam.position.set(-16, portrait ? 110 : 70, portrait ? 110 : 78); controls.target.copy(HOME_T);
}
overview();
function resize() { gl.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------------- labels ----------------
const layer = $('#labels');
type Lab = { el: HTMLDivElement; pos: THREE.Vector3; kind: 'home' | 'free' | 'place'; i?: number };
const labs: Lab[] = [];
const flagURL: Record<string, string> = {};
const flagImg = (c: string) => (flagURL[c] ??= flagCanvas(c).toDataURL());
HOMES.forEach(({ r, pos }, i) => {
  const el = document.createElement('div'); el.className = 'lab';
  el.innerHTML = `<b>${r.f ? `<img src="${flagImg(r.f)}">` : ''}${r.n}</b><i dir="ltr">@${r.h}</i>`;
  el.onclick = () => select(i);
  layer.append(el); labs.push({ el, pos: pos.clone().setY(3.1), kind: 'home', i });
});
FREE.forEach((p) => { const el = document.createElement('div'); el.className = 'lab free'; el.textContent = 'مكانك هنا؟'; el.onclick = () => $('#cta').classList.add('pulse'); layer.append(el); labs.push({ el, pos: p.clone().setY(2.2), kind: 'free' }); });
([[DOC, 'قبة الدكتور 🧑‍🔬', 5.2], [new THREE.Vector3(GATE_AT.x, 0, GATE_AT.z), 'بوابة الحي الجديد ✨', 7.6], [C2, 'الحي الجديد', 4.4]] as [THREE.Vector3, string, number][])
  .forEach(([p, t, y]) => { const el = document.createElement('div'); el.className = 'lab place'; el.textContent = t; layer.append(el); labs.push({ el, pos: p.clone().setY(y), kind: 'place' }); });

const v = new THREE.Vector3();
let sel = -1;
function placeLabels() {
  const dist = cam.position.distanceTo(controls.target);
  const near = dist < 38, close = dist < 22;
  for (const L of labs) {
    v.copy(L.pos).project(cam);
    const on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    const show = on && (L.kind === 'place' || L.i === sel || (L.kind === 'home' ? near : dist < 30));
    L.el.style.display = show ? '' : 'none';
    if (!show) continue;
    const d = cam.position.distanceTo(L.pos), s = Math.max(0.55, Math.min(1.15, 26 / d));
    L.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px,${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%,-100%) scale(${L.i === sel ? Math.max(s, 1) : s})`;
    L.el.style.zIndex = String(L.i === sel ? 9999 : Math.round(1000 - d * 5));
    L.el.classList.toggle('full', close || L.i === sel);
    L.el.classList.toggle('sel', L.i === sel);
  }
}

// ---------------- fly-to ----------------
let fly: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; s: number } | null = null;
function flyTo(target: THREE.Vector3, off = new THREE.Vector3(-4, 22, 20)) {
  fly = { p0: cam.position.clone(), t0: controls.target.clone(), p1: target.clone().add(off), t1: target.clone(), s: performance.now() };
}
function select(i: number) {
  sel = i; const h = HOMES[i];
  W.beam.position.set(h.pos.x, 20, h.pos.z);
  flyTo(h.pos);
  history.replaceState(null, '', '#@' + encodeURIComponent(h.r.h));
  $('#results').innerHTML = '';
  ($('#q') as HTMLInputElement).blur();
}

// ---------------- HUD ----------------
const n = RESIDENTS.length;
$('#count').textContent = ar(n);
$('#goal').textContent = ar(GOAL);
$('#bar i').style.width = Math.min(100, (n / GOAL) * 100) + '%';
$('#free').textContent = ar(FREE.length);
($('#cta') as HTMLAnchorElement).href = CHANNEL;
const norm = (s: string) => s.toLowerCase().replace(/^@/, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, '');
const q = $('#q') as HTMLInputElement;
q.oninput = () => {
  const k = norm(q.value); const box = $('#results'); box.innerHTML = '';
  if (!k) return;
  const hits = HOMES.map((h, i) => ({ h, i })).filter(({ h }) => norm(h.r.n).includes(k) || norm(h.r.h).includes(k)).slice(0, 8);
  if (!hits.length) { box.innerHTML = `<div class="none">مش لاقيين الاسم ده لسه… <a href="${CHANNEL}" target="_blank" rel="noopener">اكتب اسمك في كومنت 👇</a></div>`; return; }
  hits.forEach(({ h, i }) => { const b = document.createElement('button'); b.innerHTML = `${h.r.n} <span dir="ltr">@${h.r.h}</span>`; b.onclick = () => select(i); box.append(b); });
};
q.onkeydown = (e) => { if (e.key === 'Enter') ($('#results button') as HTMLButtonElement | null)?.click(); };
$('#home').onclick = () => { sel = -1; history.replaceState(null, '', location.pathname); fly = null; const t = HOME_T.clone(); const portrait = innerHeight > innerWidth; flyTo(t, new THREE.Vector3(-21, portrait ? 110 : 70, portrait ? 92 : 60)); };

// deep link: #@handle
const hash = decodeURIComponent(location.hash.replace(/^#@?/, ''));
if (hash) { const i = HOMES.findIndex((h) => norm(h.r.h) === norm(hash)); if (i >= 0) setTimeout(() => select(i), 600); }

// ---------------- loop ----------------
const clock = new THREE.Clock();
function frame() {
  const t = clock.getElapsedTime();
  if (fly) {
    const u = Math.min(1, (performance.now() - fly.s) / 1400), e = u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
    cam.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e);
    cam.position.y += Math.sin(u * Math.PI) * 10;
    if (u >= 1) fly = null;
  }
  controls.update();
  W.cloths.forEach((c, i) => wave(c, t, i));
  W.qs.forEach((s, i) => s.scale.setScalar(0.9 * (1 + 0.2 * Math.max(0, Math.sin(t * 4 + i)))));
  (W.beam.material as THREE.MeshBasicMaterial).opacity = sel >= 0 ? 0.22 + 0.06 * Math.sin(t * 5) : 0;
  fx.render(scene, cam);
  placeLabels();
  requestAnimationFrame(frame);
}
frame();
