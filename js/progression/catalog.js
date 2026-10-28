// Katalog perków: czyste dane + apply(mods, n). Bez DOM i bez importów (testowalne w Node).
// Wszystkie perki zmieniają tylko jeden obiekt modyfikatorów (mods); efekty w grze realizuje effects.js.
//
// Kontrakt:  perk = {id, name, rarity:'common'|'rare'|'epic'|'legend', max, desc, apply(mods, n, G)}
//   n = ile razy perk jest wzięty (1..max). apply liczy wkład n stacków od zera, bo mods są przebudowywane
//   od DEFAULT_MODS przy każdym nowym perku (idempotentnie, bez dryfu).

export const RARITIES = ['common', 'rare', 'epic', 'legend'];
export const RARITY_NAME = { common: 'Zwykła', rare: 'Rzadka', epic: 'Epicka', legend: 'Legendarna' };

/** Wartości neutralne. Jedyne miejsce, w którym wymienione są wszystkie pola modyfikatorów. */
export function defaultMods() {
  return {
    dmgMul: 1,          // mnożnik obrażeń gracza
    headMul: 1,         // dodatkowy mnożnik trafień w głowę (na wierzch dmgMul)
    reloadMul: 1,       // mnożnik czasu przeładowania (<1 = szybciej)
    magMul: 1,          // mnożnik pojemności magazynka
    rateMul: 1,         // mnożnik odstępu między strzałami (<1 = szybciej)
    speedMul: 1,        // mnożnik prędkości ruchu
    magnetMul: 1,       // mnożnik zasięgu przyciągania znajdziek
    maxHpAdd: 0,        // dodatkowe maks. HP
    dmgTaken: 1,        // mnożnik otrzymywanych obrażeń
    dodge: 0,           // szansa całkowitego uniku (0..1)
    regen: 0,           // HP na sekundę
    killHeal: 0,        // HP za zabójstwo
    lifesteal: 0,       // część zadanych obrażeń zamieniana w HP
    xpMul: 1,           // mnożnik XP
    coinMul: 1,         // mnożnik ZD z zabójstw
    extraShot: 0,       // szansa na darmowy drugi strzał (0..1)
    ricochet: 0,        // szansa na rykoszet (0..1)
    ricochetBounces: 0, // ile razy kula może przeskoczyć dalej
    grenadeEvery: 0,    // co ile s rzut granatu (0 = wyłączone)
    grenadeDmg: 0,      // obrażenia w środku wybuchu
    grenadeRadius: 0,   // promień wybuchu [m]
    revives: 0,         // ile razy gracz wstaje po śmierci
  };
}

/* ---- Generator apply z opisu deklaratywnego (fx). Perk może też podać własne apply. ----
   [ 'add', v ]            m[k] += v * n
   [ 'mul', v ]            m[k] *= v ^ n
   [ 'best', v0, step ]    m[k] = max(m[k], v0 + step*(n-1))
   [ 'fast', v0, step ]    m[k] = min(m[k] lub brak, v0 + step*(n-1))     (krótszy odstęp = lepiej; 0 = wyłączone)   */
function makeApply(fx) {
  return function apply(m, n) {
    for (const k in fx) {
      const [op, v, step = 0] = fx[k];
      if (op === 'add') m[k] += v * n;
      else if (op === 'mul') m[k] *= Math.pow(v, n);
      else if (op === 'best') m[k] = Math.max(m[k], v + step * (n - 1));
      else if (op === 'fast') { const x = v + step * (n - 1); m[k] = m[k] ? Math.min(m[k], x) : x; }
    }
  };
}

const P = (id, name, rarity, max, desc, fx, extra) => Object.assign({ id, name, rarity, max, desc, fx, apply: makeApply(fx) }, extra);

export const PERKS = [
  /* ===== ZWYKŁE ===== */
  P('bimber', 'Bimber w lufie', 'common', 5, 'Kula ma w sobie coś z gorzelni. +10% obrażeń za stack.', { dmgMul: ['add', 0.10] }),
  P('oko_sokola', 'Oko Sokoła z Dolnego Zadupia', 'common', 5, 'Celujesz między oczy sołtysowi. +20% obrażeń w głowę za stack.', { headMul: ['add', 0.20] }),
  P('palce_zdzicha', 'Szybkie Palce Zdzicha', 'common', 4, 'Magazynek wskakuje jak złoto do kieszeni. Przeładowanie o 12% krótsze za stack.', { reloadMul: ['mul', 0.88] }),
  P('dluga_kiszka', 'Dłuższa Kiszka', 'common', 4, 'Pomieści więcej, niż wypada. +20% pojemności magazynka za stack.', { magMul: ['add', 0.20] }),
  P('buty_biedronka', 'Buty z Biedronki', 'common', 4, 'Promocja: 2 w cenie 1, ale biegają za trzy. +6% prędkości za stack.', { speedMul: ['add', 0.06] }),
  P('zupa_tesciowej', 'Zupa od Teściowej', 'common', 5, 'Tłusta, gęsta, nie do zdarcia. +20 maks. HP i tyle leczy od razu.', { maxHpAdd: ['add', 20] }, { onPick: 20 }),
  P('zeszyt_notatek', 'Zeszyt z Notatkami', 'common', 5, 'Zapisujesz każdego, którego ustrzeliłeś. +12% XP za stack.', { xpMul: ['add', 0.12] }),
  P('kebab_po_robocie', 'Kebab po Robocie', 'common', 5, 'Z sosem czosnkowym, więc nikt nie chce być blisko. +2 HP za każde zabójstwo.', { killHeal: ['add', 2] }),
  P('magnes_zd', 'Magnes na ZD', 'common', 3, 'Kieszenie jak odkurzacz. +50% zasięgu zbierania znajdziek za stack.', { magnetMul: ['add', 0.5] }),
  P('kamizelka_wujka', 'Kamizelka po Wujku', 'common', 4, 'Wujek twierdził, że kuloodporna. Gang się z nim nie zgadza. -7% otrzymywanych obrażeń za stack.', { dmgTaken: ['mul', 0.93] }),

  /* ===== RZADKIE ===== */
  P('zubr_na_kaca', 'Żubr na Kaca', 'rare', 3, 'Rano boli mniej, jak się nie zasypia. +1 HP na sekundę za stack.', { regen: ['add', 1] }),
  P('amunicja_z_odzysku', 'Amunicja z Odzysku', 'rare', 3, 'Przetopiona z kranów i kołder. +20% obrażeń za stack.', { dmgMul: ['add', 0.20] }),
  P('tiger_o_polnocy', 'Tiger o Północy', 'rare', 3, 'Palec drży, spust tańczy. Strzelasz o 10% szybciej za stack.', { rateMul: ['mul', 0.90] }),
  P('wampir_z_biedronki', 'Wampir z Biedronki', 'rare', 3, 'Gryzie przez kulę. 5% zadanych obrażeń wraca jako HP za stack.', { lifesteal: ['add', 0.05] }),
  P('granat_tesciowej', 'Granat Teściowej', 'rare', 3, 'Teściowa rzuca sama, bez pytania. Automatyczny granat co 14 s (o 3 s krócej za stack).',
    { grenadeEvery: ['fast', 14, -3], grenadeDmg: ['best', 70, 20], grenadeRadius: ['best', 4, 0.5] }),
  P('unik_po_piatym', 'Unik po Piątym Piwie', 'rare', 3, 'Nikt tak nie lawiruje jak człowiek, który nie wie, gdzie jest. +7% szansy na pełny unik za stack.', { dodge: ['add', 0.07] }),
  P('rykoszet_od_sciany', 'Rykoszet od Ściany', 'rare', 3, 'Kula szuka sobie kolejnego gangstera. +18% szansy na rykoszet za stack.', { ricochet: ['add', 0.18], ricochetBounces: ['best', 1, 0] }),
  P('echo_w_remizie', 'Echo w Remizie', 'rare', 3, 'Strzał odbija się od ścian i wraca. +10% szansy na darmowy drugi strzał za stack.', { extraShot: ['add', 0.10] }),
  P('chciwosc_soltysa', 'Chciwość Sołtysa', 'rare', 3, 'Co gang upuści, to sołtys policzy. +25% ZD z zabójstw za stack.', { coinMul: ['add', 0.25] }),

  /* ===== EPICKIE ===== */
  P('czysta_wyborowa', 'Czysta Wyborowa', 'epic', 2, 'Siedemdziesiąt procent prawdy w każdej kuli. +40% obrażeń za stack.', { dmgMul: ['add', 0.40] }),
  P('dubeltowka_dziadka', 'Dubeltówka Dziadka', 'epic', 2, 'Dziadek zawsze strzelał dwa razy, na wszelki wypadek. +25% szansy na darmowy drugi strzał za stack.', { extraShot: ['add', 0.25] }),
  P('halina_czuwa', 'Siostra Halina Czuwa', 'epic', 1, 'Pada trup, wchodzi Halina. Raz na run wstajesz z połową zdrowia.', { revives: ['add', 1] }),
  P('piwnica_granatow', 'Piwnica Pełna Granatów', 'epic', 2, 'Dziadek po wojnie nie wyrzucał niczego. Automatyczny granat co 7 s, większy wybuch (o 1,5 s krócej za stack).',
    { grenadeEvery: ['fast', 7, -1.5], grenadeDmg: ['best', 110, 40], grenadeRadius: ['best', 5.5, 1] }),
  P('transfuzja_z_zubra', 'Transfuzja z Żubra', 'epic', 2, 'Krew z trawą bizonią. 12% zadanych obrażeń wraca jako HP za stack.', { lifesteal: ['add', 0.12] }),
  P('bilard_w_remizie', 'Bilard w Remizie', 'epic', 2, 'Trzy bandy i do łuzy. +35% szansy na rykoszet za stack, kula przeskakuje do dwóch celów.', { ricochet: ['add', 0.35], ricochetBounces: ['best', 2, 0] }),
  P('pancerz_z_kaloryfera', 'Pancerz z Kaloryfera', 'epic', 2, 'Żeliwo, 14 żeber, zero ogrzewania. +50 maks. HP i -15% otrzymywanych obrażeń za stack.', { maxHpAdd: ['add', 50], dmgTaken: ['mul', 0.85] }, { onPick: 50 }),
  P('turbopolka', 'Turbopolka', 'epic', 1, 'BPM 190, nikt nie nadąża. +15% prędkości i strzelasz o 12% szybciej.', { speedMul: ['add', 0.15], rateMul: ['mul', 0.88] }),

  /* ===== LEGENDARNE ===== */
  P('trzy_siodemki', 'Trzy Siódemki', 'legend', 1, 'Los się uśmiechnął, a gang nie. +75% obrażeń i +50% obrażeń w głowę.', { dmgMul: ['add', 0.75], headMul: ['add', 0.5] }),
  P('dyplom_disco', 'Dyplom Uniwersytetu Disco', 'legend', 1, 'Wydział Mordobicia, kierunek Bas i Ołów. XP x2.', { xpMul: ['add', 1.0] }),
  P('lustrzany_bandyta', 'Lustrzany Bandyta', 'legend', 1, 'Drugi ty, tylko z gorszym słuchem. +35% szansy na drugi strzał i +35% na rykoszet (do dwóch celów).', { extraShot: ['add', 0.35], ricochet: ['add', 0.35], ricochetBounces: ['best', 2, 0] }),
  P('dziewiec_zyc_kota', 'Dziewięć Żyć Kota z Remizy', 'legend', 1, 'Kot z remizy przeżył gorsze rzeczy. +2 wskrzeszenia i +30 maks. HP.', { revives: ['add', 2], maxHpAdd: ['add', 30] }, { onPick: 30 }),
  P('disco_apokalipsa', 'Disco Apokalipsa', 'legend', 1, 'Dwunasta trąba i kula lustrzana. Granat co 3,5 s, duży wybuch.', { grenadeEvery: ['fast', 3.5, 0], grenadeDmg: ['best', 170, 0], grenadeRadius: ['best', 7, 0] }),
  P('magazynek_bez_dna', 'Magazynek Bez Dna', 'legend', 1, 'Jakim cudem to się mieści? +60% magazynka, przeładowanie o 40% krótsze, ogień o 15% szybszy.', { magMul: ['add', 0.6], reloadMul: ['mul', 0.6], rateMul: ['mul', 0.85] }),
];

/** Przebudowuje mods od zera z mapy {id: stacks}. `lookup(id)` zwraca definicję perka. */
export function buildMods(owned, lookup, G) {
  const m = defaultMods();
  for (const id in owned) {
    const def = lookup(id);
    if (def && owned[id] > 0) def.apply(m, Math.min(owned[id], def.max || owned[id]), G);
  }
  m.dodge = Math.min(m.dodge, 0.5);
  m.dmgTaken = Math.max(m.dmgTaken, 0.2);
  m.extraShot = Math.min(m.extraShot, 0.95);
  m.ricochet = Math.min(m.ricochet, 0.95);
  return m;
}

/* ---- Opis łącznego efektu (do karty perka): diff mods względem neutralnych. ---- */
const pct = v => Math.round(v * 100) + '%';
const num = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const LABELS = {
  dmgMul: v => `+${pct(v - 1)} obrażeń`,
  headMul: v => `+${pct(v - 1)} obrażeń w głowę`,
  reloadMul: v => `przeładowanie ${pct(1 - v)} szybsze`,
  magMul: v => `+${pct(v - 1)} magazynka`,
  rateMul: v => `ogień ${pct(1 / v - 1)} szybszy`,
  speedMul: v => `+${pct(v - 1)} prędkości`,
  magnetMul: v => `+${pct(v - 1)} zasięgu zbierania`,
  maxHpAdd: v => `+${Math.round(v)} maks. HP`,
  dmgTaken: v => `-${pct(1 - v)} otrzymywanych obrażeń`,
  dodge: v => `${pct(v)} szansy na unik`,
  regen: v => `+${num(v)} HP/s`,
  killHeal: v => `+${num(v)} HP za zabójstwo`,
  lifesteal: v => `${pct(v)} obrażeń leczy`,
  xpMul: v => `+${pct(v - 1)} XP`,
  coinMul: v => `+${pct(v - 1)} ZD z zabójstw`,
  extraShot: v => `${pct(v)} szansy na drugi strzał`,
  ricochet: v => `${pct(v)} szansy na rykoszet`,
  grenadeEvery: v => `granat co ${num(v)} s`,
  revives: v => `${v} ${v === 1 ? 'wskrzeszenie' : 'wskrzeszenia'}`,
};
/** Np. "+40% obrażeń · +25% obrażeń w głowę" dla perka wziętego n razy. */
export function describeTotals(perk, n) {
  const base = defaultMods(), m = defaultMods();
  perk.apply(m, n);
  const out = [];
  for (const k in LABELS) if (m[k] !== base[k]) out.push(LABELS[k](m[k]));
  return out.join(' · ');
}
