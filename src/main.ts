// Phone-first: most visitors arrive from a YouTube Short on a phone held upright.
// One finger pans the map, two fingers zoom/rotate, a tap on a dome or its tag selects it, and the selected dome gets a
// bottom card with a share button (native share sheet on phones, clipboard elsewhere).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { buildWorld, wave, HOMES, FREE, DOC, GATE_AT, C2, flagCanvas, PIPE0, PIPE1 } from './world';
import { RESIDENTS } from './residents';
import { CHALLENGES } from './terrain';
import { RES } from './resources';

const GOAL = 100;
const CHANNEL = 'https://www.youtube.com/@e7na3almareekh/shorts';
const ar = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const touch = matchMedia('(pointer: coarse)').matches;

// ---------------- renderer / scene ----------------
const canvas = $<HTMLCanvasElement>('#c');
const gl = new THREE.WebGLRenderer({ canvas, antialias: !touch || devicePixelRatio < 2, powerPreference: 'high-performance' });
gl.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.75 : 2));
gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.setClearColor('#140b24');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#2a1430', 90, 230);
const W = buildWorld(scene);
scene.add(new THREE.HemisphereLight('#a99ad8', '#4a1e16', 1.35));
const moon = new THREE.DirectionalLight('#d6dcff', 1.5); moon.castShadow = true; moon.shadow.mapSize.setScalar(touch ? 1024 : 2048);
Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 180 }); moon.shadow.bias = -0.0004; moon.shadow.radius = 3;
moon.position.set(-18, 44, 30); moon.target.position.set(4, 0, 18); scene.add(moon, moon.target);
gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true;   // the city is static: render shadows once
const fx = new OutlineEffect(gl, { defaultThickness: 0.0055, defaultColor: [0.05, 0.03, 0.06] });

const cam = new THREE.PerspectiveCamera(40, 1, 0.5, 2000);
const controls = new OrbitControls(cam, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.09;
controls.maxPolarAngle = 1.25; controls.minDistance = 9; controls.maxDistance = 420;
controls.screenSpacePanning = false;                                  // pan slides along the ground like a map
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.zoomToCursor = true;
const CITY = new THREE.Vector3(4.2, 0, 17), CITY_R = 34;           // both districts + the road
const BOUND = 95;                                                   // the city + the terrain challenges around it
const clampTarget = () => { const t = controls.target; const d = Math.hypot(t.x - CITY.x, t.z - CITY.z); if (d > BOUND) { t.x = CITY.x + (t.x - CITY.x) * BOUND / d; t.z = CITY.z + (t.z - CITY.z) * BOUND / d; } };

// the city's long axis (district 1 → gate → district 2) runs along +z, so it is laid out vertically on a portrait screen
const VIEW = new THREE.Vector3(0.1, 0.84, 0.53).normalize();   // from target toward the camera
function fitDist() {
  const vf = THREE.MathUtils.degToRad(cam.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
  const halfW = 17, halfL = 31 * 0.55;                           // half width, half length foreshortened by the tilt
  return Math.max(halfW / Math.tan(hf / 2), halfL / Math.tan(vf / 2)) * 1.08;
}
const overviewPose = () => ({ p: CITY.clone().add(VIEW.clone().multiplyScalar(fitDist())), t: CITY.clone() });
function homePose(p: THREE.Vector3) {
  const d = cam.aspect < 1 ? 40 : 30;
  return { p: p.clone().add(VIEW.clone().multiplyScalar(d)), t: p.clone() };
}
// wide view that frames the city and all four challenges
function worldPose() {
  const vf = THREE.MathUtils.degToRad(cam.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
  const d = Math.max(46 / Math.tan(hf / 2), 100 * 0.55 / Math.tan(vf / 2));
  const t = new THREE.Vector3(-2, 0, 5);
  return { p: t.clone().add(VIEW.clone().multiplyScalar(d)), t };
}
function resize() {
  const w = innerWidth, h = innerHeight;
  gl.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
{ const o = overviewPose(); cam.position.copy(o.p); controls.target.copy(o.t); }

// ---------------- labels ----------------
const layer = $('#labels');
type Lab = { el: HTMLDivElement; pos: THREE.Vector3; kind: 'home' | 'free' | 'place' | 'chal' | 'fac'; i?: number; k?: number; w: number; h: number };
const labs: Lab[] = [];
const flagURL: Record<string, string> = {};
const flagImg = (c: string) => (flagURL[c] ??= flagCanvas(c).toDataURL());
HOMES.forEach(({ r, pos }, i) => {
  const el = document.createElement('div'); el.className = 'lab';
  el.innerHTML = `<b>${r.f ? `<img src="${flagImg(r.f)}" alt="">` : ''}${r.n}</b><i dir="ltr">@${r.h}</i>`;
  el.addEventListener('click', (e) => { e.stopPropagation(); select(i); });
  layer.append(el); labs.push({ el, pos: pos.clone().setY(3.1), kind: 'home', i, w: 0, h: 0 });
});
FREE.forEach((p) => { const el = document.createElement('div'); el.className = 'lab free'; el.textContent = 'مكانك هنا؟'; el.onclick = () => showFree(); layer.append(el); labs.push({ el, pos: p.clone().setY(2.2), kind: 'free', w: 0, h: 0 }); });
([[DOC, 'قبة الدكتور 🧑‍🔬', 5.2], [new THREE.Vector3(GATE_AT.x, 0, GATE_AT.z), 'بوابة الحي الجديد ✨', 7.6], [C2, 'الحي الجديد', 4.4]] as [THREE.Vector3, string, number][])
  .forEach(([p, t, y]) => { const el = document.createElement('div'); el.className = 'lab place'; el.textContent = t; layer.append(el); labs.push({ el, pos: p.clone().setY(y), kind: 'place', w: 0, h: 0 }); });

CHALLENGES.forEach((c, k) => { const el = document.createElement('div'); el.className = 'lab chal'; el.textContent = c.title; el.addEventListener('click', (e) => { e.stopPropagation(); selectChal(k); }); layer.append(el); labs.push({ el, pos: c.tag.clone(), kind: 'chal', k, w: 0, h: 0 }); });

RES.forEach((r, k) => { const el = document.createElement('div'); el.className = 'lab fac'; el.textContent = `${r.icon} ${r.fac}`; el.addEventListener('click', (e) => { e.stopPropagation(); selectRes(k); }); layer.append(el); labs.push({ el, pos: r.tag.clone(), kind: 'fac', k, w: 0, h: 0 }); });

const v = new THREE.Vector3();
let sel = -1, selC = -1;
// declutter: nearest tags first; a tag that would overlap one already placed is hidden (the selected one always wins)
type Box = [number, number, number, number];
const hit = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
function placeLabels() {
  const dist = cam.position.distanceTo(controls.target);
  const showHomes = dist < (touch ? 60 : 48), full = dist < (touch ? 30 : 24);
  const top = ($('#hud').getBoundingClientRect().bottom) - 4, bottom = $('#bottom').getBoundingClientRect().top;
  const cand: { L: Lab; x: number; y: number; d: number; s: number }[] = [];
  for (const L of labs) {
    v.copy(L.pos).project(cam);
    const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
    const want = L.kind === 'place' || L.kind === 'chal' || (L.kind === 'fac' && dist < 110) || L.i === sel || (L.kind === 'home' ? showHomes : dist < 40);
    if (!want || v.z >= 1 || x < -40 || x > innerWidth + 40 || y < top || y > bottom + 30) { L.el.style.display = 'none'; continue; }
    const d = cam.position.distanceTo(L.pos);
    cand.push({ L, x, y, d, s: L.kind === 'chal' || L.kind === 'fac' ? 0.95 : L.i === sel ? 1.1 : Math.max(0.62, Math.min(1.1, 30 / d)) });
  }
  cand.sort((a, b) => (b.L.i === sel ? 1 : 0) - (a.L.i === sel ? 1 : 0) || (a.L.kind === 'chal' ? 0 : a.L.kind === 'place' ? 1 : 0) - (b.L.kind === 'chal' ? 0 : b.L.kind === 'place' ? 1 : 0) || (a.L.kind === 'chal' ? -1 : 0) - (b.L.kind === 'chal' ? -1 : 0) || a.d - b.d);
  const placed: Box[] = [];
  for (const c of cand) {
    const L = c.L, el = L.el;
    el.classList.toggle('full', (full && L.kind === 'home') || L.i === sel);
    el.classList.toggle('sel', (L.kind === 'home' && L.i === sel) || (L.kind === 'chal' && L.k === selC) || (L.kind === 'fac' && (L.k ?? 0) + 100 === selC));
    el.style.display = '';
    if (!L.w || el.dataset.full !== String(el.classList.contains('full'))) { L.w = el.offsetWidth; L.h = el.offsetHeight; el.dataset.full = String(el.classList.contains('full')); }
    if (L.kind === 'chal' || L.kind === 'fac') c.x = Math.max(L.w / 2 + 6, Math.min(innerWidth - L.w / 2 - 6, c.x));
    const w = L.w * c.s, h = L.h * c.s, box: Box = [c.x - w / 2, c.y - h, c.x + w / 2, c.y];
    if (L.i !== sel && placed.some((b) => hit(b, box))) { el.style.display = 'none'; continue; }
    placed.push(box);
    el.style.transform = `translate(${c.x}px,${c.y}px) translate(-50%,-100%) scale(${c.s})`;
    el.style.zIndex = String(L.i === sel ? 9999 : Math.round(1000 - c.d * 5));
  }
}

// ---------------- fly-to ----------------
let fly: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; s: number; ms: number } | null = null;
function flyTo(pose: { p: THREE.Vector3; t: THREE.Vector3 }, ms = 1400) {
  fly = { p0: cam.position.clone(), t0: controls.target.clone(), p1: pose.p, t1: pose.t, s: performance.now(), ms };
}
const card = $('#card');
function select(i: number) {
  sel = i; selC = -1; card.classList.remove('chal');
  $('#share').textContent = 'شارك قبتك 📤'; const h = HOMES[i];
  W.beam.position.set(h.pos.x, 20, h.pos.z);
  flyTo(homePose(h.pos));
  history.replaceState(null, '', '#@' + encodeURIComponent(h.r.h));
  $('#results').innerHTML = ''; q.value = ''; q.blur();
  $('#cardName').innerHTML = `${h.r.f ? `<img src="${flagImg(h.r.f)}" alt="">` : ''}${h.r.n}`;
  $('#cardHandle').textContent = '@' + h.r.h;
  $('#cardWhere').textContent = h.d === 1 ? 'الحي الأول · جنب قبة الدكتور' : h.d === 2 ? 'الحي الجديد · ورا البوابة الدهب' : 'بحيرة الجليد 🧊 · أول سكانها';
  card.classList.add('on'); document.body.classList.add('carded');
}
function deselect() { sel = -1; selC = -1; card.classList.remove('on'); document.body.classList.remove('carded'); history.replaceState(null, '', location.pathname); }
function selectChal(k: number) {
  const c = CHALLENGES[k]; sel = -1; selC = k;
  const dir = c.low ? new THREE.Vector3(0.1, 0.42, 0.9).normalize() : VIEW;
  flyTo({ p: c.at.clone().add(dir.clone().multiplyScalar(c.view * (cam.aspect < 1 ? 1.6 : 1))), t: c.at.clone().setY(c.low ? 6 : 0) }, 1700);
  history.replaceState(null, '', '#' + c.key);
  $('#cardName').textContent = c.title; $('#cardHandle').textContent = ''; $('#cardWhere').textContent = c.desc;
  $('#share').textContent = 'قول فكرتك 💬';
  card.classList.add('on', 'chal'); document.body.classList.add('carded');
}
const pct = (r: { cap: number }) => Math.min(100, Math.round((r.cap / RESIDENTS.length) * 100));
function selectRes(k: number) {
  const r = RES[k], ok = r.cap >= RESIDENTS.length; sel = -1; selC = -1;
  flyTo({ p: r.at.clone().add(VIEW.clone().multiplyScalar(cam.aspect < 1 ? 42 : 30)), t: r.at.clone() }, 1500);
  history.replaceState(null, '', '#' + r.key);
  $('#cardName').textContent = `${r.icon} ${r.name}: ${ar(pct(r))}٪ ${ok ? '✅' : '⚠️'}`;
  $('#cardHandle').textContent = '';
  $('#cardWhere').textContent = ok ? `${r.fac} ${r.v ?? 'بيكفّي'} ${ar(r.cap)} ساكن… وإحنا ${ar(RESIDENTS.length)}. لسه في أمان` : `${r.fac} ${r.v ?? 'بيكفّي'} ${ar(r.cap)} ساكن بس… وإحنا ${ar(RESIDENTS.length)}! ${r.fix}`;
  $('#share').textContent = ok ? 'قول فكرتك 💬' : 'قول الحل 💬';
  selC = 100 + k; card.classList.add('on', 'chal'); document.body.classList.add('carded');
}
function showFree() { deselect(); const c = $('#cta'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); }

// tap on the 3D city: pick the nearest dome under the finger
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitP = new THREE.Vector3();
let down: { x: number; y: number; t: number } | null = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; fly = null; hideHint(); });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 400) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
  if (!ray.ray.intersectPlane(ground, hitP)) return;
  let best = -1, bd = 2.4;
  HOMES.forEach((h, i) => { const d = Math.hypot(h.pos.x - hitP.x, h.pos.z - hitP.z); if (d < bd) { bd = d; best = i; } });
  if (best >= 0) select(best); else if (FREE.some((p) => Math.hypot(p.x - hitP.x, p.z - hitP.z) < 2.2)) showFree(); else if (sel >= 0) deselect();
});

// ---------------- HUD ----------------
const n = RESIDENTS.length;
$('#count').textContent = ar(n);
$('#goal').textContent = ar(GOAL);
$('#bar i').style.width = Math.min(100, (n / GOAL) * 100) + '%';
if (FREE.length) $('#free').textContent = ar(FREE.length); else $('#cta small').textContent = 'الأرض خلصت… الحي الجاي هيتبني بأساميكم';
RES.forEach((r, k) => {
  const b = document.createElement('button'); const p = pct(r), ok = p >= 100;
  b.className = 'res' + (ok ? '' : ' low'); b.innerHTML = `${r.icon}<b>${ar(Math.min(p, 100))}٪</b>`;
  b.title = r.name; b.onclick = () => selectRes(k); $('#chips').insertBefore(b, $('#chalBtn'));
});
($('#cta') as HTMLAnchorElement).href = CHANNEL; $('#cta').addEventListener('click', () => track('cta-comment', 'دوس اكتب اسمك في كومنت'));
const norm = (s: string) => s.toLowerCase().replace(/^@/, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[\s_\-.]+/g, '');
// visit stats (GoatCounter, loaded in index.html): page views are counted automatically, these are the actions
const track = (path: string, title: string) => { const gc = (window as any).goatcounter; if (gc?.count) gc.count({ path, title, event: true }); };
const once = new Set<string>(); const trackOnce = (p: string, t: string) => { if (!once.has(p)) { once.add(p); track(p, t); } };
const q = $('#q') as HTMLInputElement;
q.oninput = () => {
  const k = norm(q.value); const box = $('#results'); box.innerHTML = '';
  if (!k) return;
  const hits = HOMES.map((h, i) => ({ h, i })).filter(({ h }) => norm(h.r.n).includes(k) || norm(h.r.h).includes(k)).slice(0, 6);
  if (k.length >= 2) trackOnce(hits.length ? 'search-found' : 'search-miss', hits.length ? 'بحث ولقى قبته' : 'بحث وملقاش اسمه');
  if (!hits.length) { box.innerHTML = `<div class="none">لسه مش لاقيين الاسم ده… <a href="${CHANNEL}" target="_blank" rel="noopener">اكتب اسمك في كومنت 👇</a></div>`; return; }
  hits.forEach(({ h, i }) => {
    const b = document.createElement('button');
    b.innerHTML = `${h.r.f ? `<img src="${flagImg(h.r.f)}" alt="">` : ''}<b>${h.r.n}</b> <span dir="ltr">@${h.r.h}</span>`;
    b.onclick = () => select(i); box.append(b);
  });
};
q.onkeydown = (e) => { if (e.key === 'Enter') ($('#results button') as HTMLButtonElement | null)?.click(); };
q.onfocus = () => { hideHint(); };
$('#home').onclick = () => { deselect(); flyTo(overviewPose(), 1200); };
$('#close').onclick = () => deselect();
$('#chalBtn').onclick = () => { deselect(); flyTo(worldPose(), 1800); };
$('#share').onclick = async () => {
  if (selC >= 0) { track('comment-click', 'دوس قول فكرتك'); open(CHANNEL, '_blank', 'noopener'); return; }
  if (sel < 0) return;
  const h = HOMES[sel], url = location.origin + location.pathname + '#@' + encodeURIComponent(h.r.h);
  const text = `دي قبتي على المريخ 🚀 ${h.r.n}`; track('share', 'شارك قبته');
  try {
    if (navigator.share) await navigator.share({ title: 'إحنا على المريخ', text, url });
    else { await navigator.clipboard.writeText(`${text}\n${url}`); toast('اتنسخ الرابط ✅'); }
  } catch { /* the visitor closed the share sheet */ }
};
function toast(t: string) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 1600); }
let hinted = false;
function hideHint() { if (hinted) return; hinted = true; $('#hint').classList.add('off'); }
setTimeout(hideHint, 7000);

// deep link: #@handle
const hash = decodeURIComponent(location.hash.replace(/^#@?/, ''));
const rk = RES.findIndex((r) => r.key === hash);
if (rk >= 0) setTimeout(() => selectRes(rk), 700);
const ck = CHALLENGES.findIndex((c) => c.key === hash);
if (ck >= 0) setTimeout(() => selectChal(ck), 700);
else if (hash) { const i = HOMES.findIndex((h) => norm(h.r.h) === norm(hash)); if (i >= 0) { setTimeout(() => select(i), 700); setTimeout(() => track('from-share', 'دخل من رابط قبة متشاركة'), 3000); } }

// ---------------- loop (render only while something moves) ----------------
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const t = clock.getElapsedTime();
  if (fly) {
    const u = Math.min(1, (performance.now() - fly.s) / fly.ms), e = u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
    cam.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e);
    cam.position.y += Math.sin(u * Math.PI) * 8;
    if (u >= 1) fly = null;
  }
  controls.update(); clampTarget();
  { const cd = cam.position.distanceTo(controls.target); const fog = scene.fog as THREE.Fog; fog.near = cd + 30; fog.far = cd + 200; }
  W.cloths.forEach((c, i) => wave(c, t, i));
  W.qs.forEach((s, i) => s.scale.setScalar(0.9 * (1 + 0.2 * Math.max(0, Math.sin(t * 4 + i)))));
  W.beacon.material.opacity = (Math.sin(t * 3) > 0.6 ? 1 : 0.25);
  W.glint.material.opacity = 0.5 + 0.5 * Math.max(0, Math.sin(t * 2.3)) ** 3;
  W.lava.material.opacity = 0.45 + 0.15 * Math.sin(t * 1.1);
  W.pulses.forEach((s, i) => { const u = (t * 0.35 + i / W.pulses.length) % 1; s.position.copy(PIPE1).lerp(PIPE0, u).setY(0.75); s.material.opacity = 0.9 * Math.sin(u * Math.PI); });
  (W.beam.material as THREE.MeshBasicMaterial).opacity = sel >= 0 ? 0.22 + 0.06 * Math.sin(t * 5) : 0;
  fx.render(scene, cam);
  placeLabels();
}
frame();
