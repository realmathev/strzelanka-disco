// Realizacja modyfikatorów perków w grze. Cała logika siedzi tutaj, w hookach na DS.bus, więc reszta kodu gry
// nie musi znać perków. Wszystkie liczby bierze z G.mods (jeden obiekt) i CFG.fx.
//
// Mapa: mods.dmgMul/headMul -> bonus na 'hit' | extraShot -> 'shot' | ricochet -> 'hit' | dmgTaken/dodge/revives -> 'damage'
//       lifesteal -> 'hit' | killHeal/coinMul -> 'kill' | regen/speedMul/grenade* -> 'update' | mag/reload/rate/magnet -> state.js
import { S } from '../core/state.js';
import { DS } from '../core/ds.js';
import { save, opt, persist } from '../core/save.js';
import { canvas, scene } from '../render/renderer.js';
import { addTracer } from '../render/fx3d.js';
import { addFloater, announce } from '../render/comicfx.js';
import { sfx } from '../audio/sfx.js';
import { P } from '../player/player.js';
import { collide } from '../player/collision.js';
import { fire } from '../weapons/fire.js';
import { damageEnemy } from '../game/combat.js';
import { CFG } from './config.js';
import { ensure, applyPatches, restorePatches } from './state.js';

let inRico = false;   // trwa rykoszet/granat: te obrażenia nie dostają bonusów 'hit' (żadnej reakcji łańcuchowej)
let inEcho = false;   // trwa darmowy drugi strzał: jego 'shot' nie losuje kolejnego
let swallowLockUntil = 0;
let noOverT = 0;

const rA = new THREE.Vector3(), rB = new THREE.Vector3(), boom = new THREE.Vector3();

/* ---------- pomocnicze ---------- */
function healPlayer(amount, source) {
  const G = S.G;
  if (!G || G.dead || amount <= 0) return 0;
  const before = G.hp;
  G.hp = Math.min(G.maxHp, G.hp + amount);
  const real = G.hp - before;
  if (real > 0) DS.bus.emit('heal', { amount: real, source });
  return real;
}

function nearestEnemy(x, z, range, exclude) {
  const G = S.G;
  let best = null, bd = range * range;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i];
    if (!e.alive || (exclude && exclude.indexOf(e) >= 0)) continue;
    const dx = e.g.position.x - x, dz = e.g.position.z - z, d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function relock() { try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }

/* ---------- 'hit': obrażenia, kradzież życia, rykoszet ---------- */
function onHit(ev) {
  if (inRico) return;
  const G = S.G, m = G && G.mods;
  if (!m || !ev.enemy) return;
  const mul = m.dmgMul * (ev.head ? m.headMul : 1);
  const total = ev.dmg * mul;
  if (mul > 1 && ev.enemy.alive) ev.enemy.hp -= total - ev.dmg;   // 'hit' leci przed sprawdzeniem śmierci, więc bonus liczy się do zabójstwa
  if (m.lifesteal > 0 && !G.dead) {
    G.prog.lsAcc += total * m.lifesteal;
    if (G.prog.lsAcc >= 2) { const h = Math.floor(G.prog.lsAcc); G.prog.lsAcc -= h; healPlayer(h, 'perk'); }
  }
  if (m.ricochet > 0 && Math.random() < m.ricochet) ricochet(ev.enemy, total, ev.point);
}

function ricochet(from, total, point) {
  const G = S.G, m = G.mods;
  const hitSet = [from];
  rA.copy(point);
  let cur = from, dmg = total;
  inRico = true;
  try {
    for (let b = 0; b < Math.max(1, m.ricochetBounces); b++) {
      const t = nearestEnemy(cur.g.position.x, cur.g.position.z, CFG.fx.ricochetRange, hitSet);
      if (!t) break;
      hitSet.push(t);
      dmg *= CFG.fx.ricochetDmg;
      rB.set(t.g.position.x, t.g.position.y + 1.1, t.g.position.z);
      addTracer(rA, rB, 0x43c7ff, 0.18);
      damageEnemy(t, dmg, false, rB);
      rA.copy(rB); cur = t;
    }
  } finally { inRico = false; }
  if (opt.onoma) addFloater('RYKOSZET!', { world: rA.clone(), size: 26, life: 0.55, color: '#43c7ff', vy: -40, rot: -0.15 });
}

/* ---------- 'shot': darmowy drugi strzał ---------- */
function onShot() {
  if (inEcho) return;
  const G = S.G, m = G && G.mods;
  if (!m || m.extraShot <= 0 || G.dead || Math.random() >= m.extraShot) return;
  const a0 = G.ammo[G.weapon], ft = G.fireT;
  inEcho = true;
  try { G.ammo[G.weapon] = a0 + 1; G.fireT = 0; fire(); } finally { inEcho = false; }
  if (G.ammo[G.weapon] > a0) G.ammo[G.weapon] = a0;     // fire() nie wystrzeliło (np. przeładowanie): bez darmowych nabojów
  G.fireT = ft;
  if (opt.onoma) addFloater('ECHO!', { x: innerWidth * 0.5 + (Math.random() * 60 - 30), y: innerHeight * 0.42, size: 28, life: 0.5, color: '#43c7ff', vy: -40, rot: -0.1 });
}

/* ---------- 'damage': redukcja, unik, wskrzeszenie ---------- */
function undoDeath(hp, msg, sub) {
  const G = S.G;
  G.dead = false; G.deadT = 0; G.hp = Math.max(1, Math.min(G.maxHp, hp));
  P.pos.y = 0;
  G.enemies.forEach(e => { e.shootT = 2.5; });
  swallowLockUntil = performance.now() + 600;           // die() zwolniło kursor: nie pozwól, żeby to spauzowało grę
  // die() zaplanowało ekran porażki na +1,4 s; chowamy go zamiast zostawiać błysk "Leżysz."
  const app = document.getElementById('app');
  if (app) app.classList.add('lv-noover');
  clearTimeout(noOverT);
  noOverT = setTimeout(() => {
    if (app) app.classList.remove('lv-noover');
    const o = document.getElementById('scrOver');
    if (o && S.G && !S.G.dead) o.hidden = true;
  }, 1700);
  announce(msg, sub);
}

function onDamage(ev) {
  const G = S.G, m = G && G.mods, pr = G && G.prog;
  if (!m || !pr) return;
  const amount = ev.amount;
  let dodged = false, eff = amount;
  if (m.dodge > 0 && Math.random() < m.dodge) { dodged = true; eff = 0; }
  else if (m.dmgTaken < 1) eff = amount * Math.max(CFG.fx.damageTakenFloor, m.dmgTaken);
  if (eff < amount) {
    if (G.dead) {                                       // cios był śmiertelny, ale po redukcji gracz by przeżył
      const left = pr.lastHp - eff;
      if (left > 0) { undoDeath(left, dodged ? 'UNIK!' : 'NIE TYM RAZEM!', dodged ? 'Pijak ma refleks' : 'Kamizelka wujka zadziałała'); }
    } else {
      G.hp = Math.min(G.maxHp, G.hp + (amount - eff));
      if (dodged && opt.onoma) addFloater('UNIK!', { x: innerWidth * 0.5, y: innerHeight * 0.55, size: 34, life: 0.6, color: '#7dff9a', vy: -40, rot: 0.1 });
    }
  }
  if (G.dead && m.revives > pr.revivesUsed && pr.reviveT <= 0) pr.reviveT = 0.9;
  pr.lastHp = G.hp;
}

function doRevive() {
  const G = S.G, pr = G.prog;
  pr.revivesUsed++;
  const hp = Math.round(G.maxHp * CFG.fx.reviveHpFrac);
  undoDeath(hp, 'WSKRZESZENIE!', 'Siostra Halina trzyma kroplówkę');
  sfx('heal');
  DS.bus.emit('heal', { amount: G.hp, source: 'revive' });
  relock();
}

/* ---------- 'kill': leczenie i ZD ---------- */
function onKill(ev) {
  const G = S.G, m = G && G.mods;
  if (!m) return;
  if (m.killHeal > 0) healPlayer(m.killHeal, 'perk');
  if (m.coinMul > 1 && ev.value > 0) {
    const extra = Math.round(ev.value * (m.coinMul - 1));
    if (extra > 0) { save.coins += extra; G.earned += extra; persist(); }
  }
}

/* ---------- 'update': regeneracja, szybkość, granaty, wskrzeszenie ---------- */
function throwGrenade() {
  const G = S.G, m = G.mods;
  const t = nearestEnemy(P.pos.x, P.pos.z, CFG.fx.grenadeRange);
  if (!t) return false;
  boom.set(t.g.position.x, t.g.position.y + 0.9, t.g.position.z);
  rA.set(P.pos.x, P.pos.y + 1.4, P.pos.z);
  addTracer(rA, boom, 0xff8a1e, 0.28);
  const R = m.grenadeRadius, fall = CFG.fx.grenadeFalloff;
  inRico = true;
  try {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const d = Math.hypot(e.g.position.x - boom.x, e.g.position.z - boom.z);
      if (d > R) continue;
      rB.set(e.g.position.x, e.g.position.y + 1.1, e.g.position.z);
      damageEnemy(e, m.grenadeDmg * m.dmgMul * (1 - (1 - fall) * (d / R)), false, rB);
    }
  } finally { inRico = false; }
  explosionFx(boom, R);
  return true;
}

let boomTex = null;
function explosionFx(p, R) {
  const G = S.G;
  if (!boomTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,248,200,1)'); g.addColorStop(0.45, 'rgba(255,140,30,.9)'); g.addColorStop(1, 'rgba(120,30,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    boomTex = new THREE.CanvasTexture(c);
  }
  for (let i = 0; i < 2; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: boomTex, transparent: true, depthWrite: false }));
    s.position.copy(p); s.position.y += i * 0.4; s.scale.set(0.3, 0.3, 1);
    s.renderOrder = 5;
    scene.add(s);
    G.fx3d.push({ o: s, t: 0.5 + i * 0.2, life: 0.5 + i * 0.2, grow: R * (i ? 1.3 : 1.9) });
  }
  G.shake += 0.35;
  sfx('shotgun');
  addFloater('BUM!', { world: p.clone().setY(p.y + 1.6), size: 52, life: 0.8, color: '#ff8a1e', vy: -40, rot: -0.2, burst: true });
}

function onUpdate(dt) {
  const G = S.G, m = G && G.mods, pr = G && G.prog;
  if (!m || !pr) return;
  if (G.dead) {
    if (pr.reviveT > 0) { pr.reviveT -= dt; if (pr.reviveT <= 0) doRevive(); }
    return;
  }
  if (m.regen > 0 && G.hp < G.maxHp) G.hp = Math.min(G.maxHp, G.hp + m.regen * dt);
  if (m.speedMul > 1) { const k = (m.speedMul - 1) * dt; P.pos.x += P.vel.x * k; P.pos.z += P.vel.z * k; collide(P.pos, 0.45); }
  if (m.grenadeEvery > 0) {
    pr.grenadeT += dt;
    if (pr.grenadeT >= m.grenadeEvery) pr.grenadeT = throwGrenade() ? 0 : m.grenadeEvery - 0.4;   // brak celu: spróbuj za 0,4 s
  }
  pr.lastHp = G.hp;
}

/* ---------- instalacja ---------- */
let offs = [];
export function installEffects(extra) {
  uninstallEffects();
  const on = (ev, fn) => offs.push(DS.bus.on(ev, fn));
  on('hit', onHit); on('shot', onShot); on('damage', onDamage); on('kill', onKill); on('update', onUpdate);
  on('levelStart', () => {
    const G = S.G;
    if (G) { delete G.prog; delete G.perks; delete G.mods; }
    ensure(); applyPatches();
  });
  on('levelEnd', () => { restorePatches(); });
  if (extra) for (const k in extra) on(k, extra[k]);
  // Gdy kursor zwolniło wskrzeszenie programowe, nie traktuj tego jak wyjścia gracza z blokady myszy (inaczej: pauza).
  document.addEventListener('pointerlockchange', e => { if (performance.now() < swallowLockUntil) e.stopImmediatePropagation(); }, true);
}
export function uninstallEffects() { offs.forEach(f => f()); offs = []; }
