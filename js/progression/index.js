// ds-progression: XP z zabójstw, poziomy, jednoręki bandyta z perkami. Opis: BALANCE.md; format zdarzeń: docs/requests/ds-progression.md.
// Słucha:  'kill' {enemy, head, value, combo}, 'hit', 'shot', 'damage', 'update', 'levelStart', 'levelEnd'.
// Emituje: 'xp' {xp, level, next, gain, total}, 'levelup' {level}, 'perk' {id, rarity, stacks, level}, 'heal' {source:'perk'}.
import { S } from '../core/state.js';
import { DS } from '../core/ds.js';
import { CFG, xpForLevel } from './config.js';
import { PERKS } from './catalog.js';
import { grantPerk } from './state.js';
import { installEffects } from './effects.js';
import { addXp, emitXp, onKill, tick } from './xp.js';
import { open, isOpen, forceClose } from './levelup.js';

PERKS.forEach(p => DS.perks.register(p));

installEffects({
  levelStart: () => emitXp(0),               // HUD: pasek od zera, poziom 1
  kill: ev => onKill(ev),
  update: dt => tick(dt, open, isOpen),
  levelEnd: () => forceClose(),
});

/** Uchwyt do debugowania i do innych domen: DS.progression. */
DS.progression = {
  cfg: CFG, xpForLevel, perks: PERKS,
  state: () => (S.G && S.G.prog) || null,   // {level, xp, total, pending, pity:{sinceRare, sinceEpic, sinceLegend}, history, ...}
  mods: () => (S.G && S.G.mods) || null,    // jedyny obiekt modyfikatorów (pola: catalog.js defaultMods)
  owned: () => (S.G && S.G.perks) || {},    // {perkId: stacki}
  addXp,                                    // addXp(n): surowe XP (bez mnożników)
  levelUp: () => { const p = S.G && S.G.prog; if (p) addXp(xpForLevel(p.level) - p.xp); },
  grant: grantPerk,                         // grant('bimber'): dokłada stack bez ekranu automatu
  ui: { open, isOpen, forceClose },
};
