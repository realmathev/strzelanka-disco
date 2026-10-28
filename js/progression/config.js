// Cały balans progresji w jednym miejscu (czysty moduł: bez DOM i bez importów, da się go odpalić w Node).
// Tabela z uzasadnieniem liczb: BALANCE.md.

export const CFG = {
  /* ---------- XP i poziomy ---------- */
  xp: {
    // XP potrzebne do przejścia z poziomu L na L+1:  need(L) = round(curve.a * L ^ curve.p)
    curve: { a: 210, p: 1.38 },
    // Bazowe XP za zabójstwo wg `enemy.type` (id z DS.enemies). Nieznany typ: default * sqrt(maxHp/100), w widełkach unknownClamp.
    perKill: {
      default: 10,
      unknownClamp: [0.6, 3],
      byType: { gangster: 10, dres: 9, ochroniarz: 15, bandyta: 13, snajper: 16, pijak: 8, kamikadze: 9, medyk: 14, kierowca: 17 },
      boss: 140,               // zamiast typu, gdy enemy.boss
    },
    head: 1.5,                 // mnożnik za headshota
    combo: { per: 0.05, cap: 12 },   // 1 + min(combo, cap) * per
    wave: { per: 0.06, cap: 2.5 },   // 1 + (fala - 1) * per, nie więcej niż cap
    // Trudność (opt.difficulty: tekst lub indeks 0..2). Wyższa = więcej XP.
    difficulty: { easy: 0.85, latwy: 0.85, normal: 1, normalny: 1, hard: 1.25, trudny: 1.25, byIndex: [0.85, 1, 1.25] },
  },

  /* ---------- Jednoręki bandyta ---------- */
  slot: {
    // Zakręt zawsze kończy się wygraną perku. Rzadkość losujemy z wag (suma dowolna), potem nakładamy pity.
    weights: { common: 66, rare: 27, epic: 7 },   // legendarny tylko z jackpotu albo pity
    jackpotChance: 0.03,       // niezależny rzut na legendarny (przed wagami)
    newPerkBias: 1.6,          // waga perka, którego jeszcze nie masz, względem takiego, który już stackujesz
    spinMs: [1100, 1550, 2000],// kiedy staje bęben 1, 2, 3 (jak w kasynie); przy reduced-motion: reducedMs
    reducedMs: [350, 500, 650],
  },
  pity: {                      // liczniki w runie (G.prog), nie w meta
    rareEvery: 3,              // po tylu poziomach bez rzadkiej+ następna gwarantowana >= rzadka
    epicEvery: 8,              // po tylu poziomach bez epickiej+ następna gwarantowana >= epicka
    legendEvery: 0,            // 0 = wyłączone; N = po N poziomach bez legendarnej gwarantowana legendarna
  },

  /* ---------- Efekty perków (stałe pomocnicze) ---------- */
  fx: {
    ricochetRange: 9,          // m od trafionego wroga
    ricochetDmg: 0.6,          // część obrażeń przechodząca dalej
    grenadeRange: 38,          // m, nie rzuca w dalszych wrogów
    grenadeFalloff: 0.4,       // obrażenia na skraju wybuchu (część pełnych)
    reviveHpFrac: 0.5,         // wskrzeszenie wraca z taką częścią maks. HP
    damageTakenFloor: 0.2,     // dmgTaken nie spadnie poniżej
    dodgeCap: 0.5,
    levelUpDelay: 0.7,         // s od progu XP do ekranu automatu (żeby zobaczyć headshota)
  },
};

/** XP potrzebne, by przejść z poziomu `level` (1 = start) na następny. */
export function xpForLevel(level) {
  const c = CFG.xp.curve;
  return Math.round(c.a * Math.pow(Math.max(1, level), c.p));
}

export function difficultyMul(value) {
  const d = CFG.xp.difficulty;
  if (typeof value === 'number') return d.byIndex[Math.max(0, Math.min(d.byIndex.length - 1, Math.round(value)))] || 1;
  if (typeof value === 'string' && d[value.toLowerCase()] != null) return d[value.toLowerCase()];
  return 1;
}

/** XP za jedno zabójstwo. `enemy` może mieć type/boss/maxHp; mods.xpMul liczy wołający. */
export function xpForKill({ enemy, head, combo, wave, difficulty }) {
  const k = CFG.xp.perKill;
  let base;
  if (enemy && typeof enemy.xp === 'number') base = enemy.xp;          // wróg sam podaje wagę (nadpisuje tabelę)
  else if (enemy && enemy.boss) base = k.boss;
  else if (enemy && k.byType[enemy.type] != null) base = k.byType[enemy.type];
  else {
    const hp = (enemy && (enemy.maxHp || enemy.hp)) || 100;
    base = k.default * Math.min(k.unknownClamp[1], Math.max(k.unknownClamp[0], Math.sqrt(hp / 100)));
  }
  const w = Math.min(CFG.xp.wave.cap, 1 + Math.max(0, (wave || 1) - 1) * CFG.xp.wave.per);
  const c = 1 + Math.min(combo || 0, CFG.xp.combo.cap) * CFG.xp.combo.per;
  return base * (head ? CFG.xp.head : 1) * w * c * difficultyMul(difficulty);
}
