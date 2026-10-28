// Losowanie rzadkości (z pity) i perka oraz układ symboli na bębnach. Czysty moduł (bez DOM), RNG wstrzykiwany.
import { CFG } from './config.js';
import { RARITIES } from './catalog.js';

const rank = r => RARITIES.indexOf(r);

/** Liczniki pity w runie. */
export function newPity() { return { sinceRare: 0, sinceEpic: 0, sinceLegend: 0 }; }

/**
 * Losuje rzadkość dla jednego poziomu. Mutuje liczniki `pity`.
 * Zwraca {rarity, why}: why = 'natural' | 'jackpot' | 'pity-rare' | 'pity-epic' | 'pity-legend'.
 */
export function rollRarity(pity, rng = Math.random, cfg = CFG) {
  const S = cfg.slot, Y = cfg.pity;
  pity.sinceRare++; pity.sinceEpic++; pity.sinceLegend++;
  let rarity, why = 'natural';
  if (rng() < S.jackpotChance) { rarity = 'legend'; why = 'jackpot'; }
  else {
    let tot = 0; for (const r in S.weights) tot += S.weights[r];
    let x = rng() * tot; rarity = 'common';
    for (const r of RARITIES) { const w = S.weights[r] || 0; if (w <= 0) continue; if (x < w) { rarity = r; break; } x -= w; }
  }
  // Pity: podnosi do gwarantowanego minimum.
  const floor = (min, reason) => { if (rank(rarity) < rank(min)) { rarity = min; why = reason; } };
  if (Y.rareEvery > 0 && pity.sinceRare >= Y.rareEvery) floor('rare', 'pity-rare');
  if (Y.epicEvery > 0 && pity.sinceEpic >= Y.epicEvery) floor('epic', 'pity-epic');
  if (Y.legendEvery > 0 && pity.sinceLegend >= Y.legendEvery) floor('legend', 'pity-legend');
  if (rank(rarity) >= rank('rare')) pity.sinceRare = 0;
  if (rank(rarity) >= rank('epic')) pity.sinceEpic = 0;
  if (rarity === 'legend') pity.sinceLegend = 0;
  return { rarity, why };
}

/** Perki z rzadkości `rarity`, których jeszcze nie wymaksowano. */
function eligible(rarity, perks, owned) {
  return perks.filter(p => p.rarity === rarity && (owned[p.id] || 0) < (p.max || 1));
}

/**
 * Wybiera perk: najpierw z wylosowanej rzadkości, a gdy wszystkie wymaksowane, najbliższa niższa, potem wyższa.
 * Zwraca {perk, rarity} (rarity może być inna niż żądana) albo null, gdy nic nie zostało.
 */
export function pickPerk(rarity, perks, owned, rng = Math.random, cfg = CFG) {
  const order = [];
  for (let r = rank(rarity); r >= 0; r--) order.push(RARITIES[r]);
  for (let r = rank(rarity) + 1; r < RARITIES.length; r++) order.push(RARITIES[r]);
  for (const r of order) {
    const pool = eligible(r, perks, owned);
    if (!pool.length) continue;
    const w = pool.map(p => ((owned[p.id] || 0) > 0 ? 1 : cfg.slot.newPerkBias));
    let x = rng() * w.reduce((a, b) => a + b, 0), i = 0;
    for (; i < pool.length - 1; i++) { if (x < w[i]) break; x -= w[i]; }
    return { perk: pool[i], rarity: r };
  }
  return null;
}

/* ---- Symbole bębnów: układ koduje rzadkość ---- */
export const SYMBOLS = {
  low: ['DIA', 'HEART', 'BAR'],    // trzy takie same = rzadka
  mid: ['STAR', 'DISCO'],          // trzy takie same = epicka
  top: ['7'],                      // 7 7 7 = legendarna
};
const ALL_NON_TOP = [...SYMBOLS.low, ...SYMBOLS.mid];
const pick = (a, rng) => a[Math.floor(rng() * a.length) % a.length];

/** Układ trzech symboli dla rzadkości. Zwykła = mieszanka bez trójki (z podpuchą: czasem para siódemek). */
export function layoutFor(rarity, rng = Math.random) {
  if (rarity === 'legend') return ['7', '7', '7'];
  if (rarity === 'epic') { const s = pick(SYMBOLS.mid, rng); return [s, s, s]; }
  if (rarity === 'rare') { const s = pick(SYMBOLS.low, rng); return [s, s, s]; }
  for (;;) {
    const t = rng() < 0.18 ? ['7', '7', pick(ALL_NON_TOP, rng)] : [pick(ALL_NON_TOP, rng), pick(ALL_NON_TOP, rng), pick(ALL_NON_TOP, rng)];
    if (t[0] === t[1] && t[1] === t[2]) continue;
    // Para siódemek nie może stać na bębnach 1-2 w zwykłej? Może: to tylko podpucha, byle nie trójka.
    if (rng() < 0.5) t.reverse();
    return t;
  }
}

/** Odczyt rzadkości z układu (odwrotność layoutFor); do testów i nagłówka paytable. */
export function rarityOfLayout(l) {
  if (l[0] === l[1] && l[1] === l[2]) {
    if (l[0] === '7') return 'legend';
    if (SYMBOLS.mid.includes(l[0])) return 'epic';
    return 'rare';
  }
  return 'common';
}
