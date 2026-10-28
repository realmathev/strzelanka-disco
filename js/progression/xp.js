// XP z zabójstw, poziomy i kolejka ekranów jednorękiego bandyty.
// Zdarzenia wyjściowe: 'xp' {xp, level, next, gain, total} (xp = postęp w bieżącym poziomie, next = próg tego poziomu),
//                      'levelup' {level} (w chwili przekroczenia progu, ekran automatu otwiera się chwilę później).
import { S } from '../core/state.js';
import { DS } from '../core/ds.js';
import { opt } from '../core/save.js';
import { CFG, xpForLevel, xpForKill } from './config.js';
import { ensure } from './state.js';

export function emitXp(gain = 0) {
  const pr = ensure();
  if (!pr) return;
  DS.bus.emit('xp', { xp: Math.floor(pr.xp), level: pr.level, next: xpForLevel(pr.level), gain: Math.round(gain), total: Math.floor(pr.total) });
}

/** Dodaje XP (już po mnożnikach). Może awansować o kilka poziomów naraz; każdy dostaje własny ekran automatu. */
export function addXp(amount) {
  const pr = ensure();
  if (!pr || !(amount > 0)) return;
  pr.xp += amount; pr.total += amount;
  let up = 0;
  while (pr.xp >= xpForLevel(pr.level)) {
    pr.xp -= xpForLevel(pr.level);
    pr.level++; pr.pending++; up++;
    if (pr.delay < CFG.fx.levelUpDelay) pr.delay = CFG.fx.levelUpDelay;
    DS.bus.emit('levelup', { level: pr.level });
  }
  emitXp(amount);
}

export function onKill(ev) {
  const G = S.G, pr = ensure();
  if (!G || !pr) return;
  const base = xpForKill({ enemy: ev.enemy, head: ev.head, combo: ev.combo, wave: G.wave, difficulty: opt.difficulty });
  addXp(Math.max(1, Math.round(base * G.mods.xpMul)));
}

/** Wołane co klatkę z 'update': otwiera ekran automatu, gdy czeka poziom i nic go nie blokuje. */
export function tick(dt, open, isOpen) {
  const G = S.G, pr = G && G.prog;
  if (!pr || pr.pending <= 0 || isOpen()) return;
  if (G.dead || G.paused || S.mode !== 'game') return;
  pr.delay -= dt;
  if (pr.delay > 0) return;
  pr.pending--;
  open(pr.level - pr.pending);   // poziom, który właśnie nagradzamy (przy kilku naraz: kolejno)
}
