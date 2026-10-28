// Stan progresji w runie (S.G.prog / S.G.perks / S.G.mods) oraz nakładanie modyfikatorów na definicje broni i znajdziek.
// Wszystko liczy się od zera z mapy perków, więc stan nie dryfuje. Liczniki pity żyją w G.prog (run), nie w meta-zapisie.
import { S } from '../core/state.js';
import { DS } from '../core/ds.js';
import { defaultMods, buildMods } from './catalog.js';
import { newPity } from './roll.js';

/** Zwraca G.prog (tworzy przy pierwszym użyciu w tym runie). null, gdy nie ma runu. */
export function ensure() {
  const G = S.G;
  if (!G) return null;
  if (!G.prog) {
    G.prog = {
      level: 1, xp: 0, total: 0,          // xp = XP w bieżącym poziomie, total = łącznie w runie
      pending: 0, delay: 0,               // ile ekranów automatu czeka i opóźnienie otwarcia
      pity: newPity(), spins: 0,
      revivesUsed: 0, reviveT: 0,         // wskrzeszenia: zużyte i licznik opóźnionego wstania
      grenadeT: 0, lsAcc: 0, lastHp: G.hp, baseMaxHp: G.maxHp,
      history: [],                        // [{level, id, rarity, stacks, why}]
    };
    G.perks = {};                         // id -> stacki
    G.mods = defaultMods();
  }
  return G.prog;
}

export const mods = () => (S.G && S.G.mods) || null;
export const owned = () => (S.G && S.G.perks) || {};

/** Dokłada stack perka i przebudowuje modyfikatory. Zwraca nowe stacki albo 0, gdy się nie da. */
export function grantPerk(id) {
  const G = S.G, pr = ensure(), def = DS.perks.get(id);
  if (!G || !def) return 0;
  const cur = G.perks[id] || 0;
  if (cur >= (def.max || 1)) return 0;
  G.perks[id] = cur + 1;
  const prevAdd = G.mods.maxHpAdd;
  G.mods = buildMods(G.perks, i => DS.perks.get(i), G);
  // Maks. HP = baza z runu + dodatki; różnica leczy tyle, ile mówi onPick.
  G.maxHp = pr.baseMaxHp + G.mods.maxHpAdd;
  if (G.mods.maxHpAdd !== prevAdd) G.hp = Math.min(G.maxHp, G.hp + (def.onPick || 0));
  applyPatches();
  return cur + 1;
}

/* ---------- Nakładki na definicje (jedno miejsce, odwracalne) ---------- */
// Magazynek, czas przeładowania i kadencja siedzą w DS.weapons, a magnes w DS.pickups, więc zmieniamy je w definicjach
// na czas runu i przywracamy na 'levelEnd'. Docelowo fire.js/pickups.js mogą czytać DS.progression.mods() same.
const baseW = new Map(), baseP = new Map();
const num = v => typeof v === 'number' && isFinite(v);

export function applyPatches() {
  const G = S.G, m = (G && G.mods) || defaultMods();
  for (const W of DS.weapons.all()) {
    let b = baseW.get(W);
    if (!b) baseW.set(W, b = { mag: W.mag, reload: W.reload, rate: W.rate });
    if (num(b.mag)) {
      const mag = Math.max(1, Math.round(b.mag * m.magMul));
      if (G && G.ammo && num(G.ammo[W.id]) && mag > W.mag) G.ammo[W.id] += mag - W.mag;   // nowe naboje od razu w magazynku
      W.mag = mag;
    }
    if (num(b.reload)) W.reload = Math.max(0.25, b.reload * m.reloadMul);
    if (num(b.rate)) W.rate = Math.max(0.04, b.rate * Math.max(0.4, m.rateMul));
  }
  for (const D of DS.pickups.all()) {
    let b = baseP.get(D);
    if (!b) baseP.set(D, b = { magnet: D.magnet });
    if (num(b.magnet)) D.magnet = b.magnet * m.magnetMul;
  }
}

export function restorePatches() {
  for (const [W, b] of baseW) { if (num(b.mag)) W.mag = b.mag; if (num(b.reload)) W.reload = b.reload; if (num(b.rate)) W.rate = b.rate; }
  for (const [D, b] of baseP) if (num(b.magnet)) D.magnet = b.magnet;
  baseW.clear(); baseP.clear();
}
