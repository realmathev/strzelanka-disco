// Katalog perków: czyste dane + apply(mods, n). Bez DOM i bez importów (testowalne w Node).
// Wszystkie perki zmieniają tylko jeden obiekt modyfikatorów (mods); efekty w grze realizuje effects.js.
//
// Kontrakt:  perk = {id, name, rarity:'common'|'rare'|'epic'|'legend', max, desc, apply(mods, n, G)}
//   n = ile razy perk jest wzięty (1..max). apply liczy wkład n stacków od zera, bo mods są przebudowywane
//   od DEFAULT_MODS przy każdym nowym perku (idempotentnie, bez dryfu).

import { L } from '../core/i18n.js';

export const RARITIES = ['common', 'rare', 'epic', 'legend'];
export const RARITY_NAME = { common: L('Zwykła', 'Common'), rare: L('Rzadka', 'Rare'), epic: L('Epicka', 'Epic'), legend: L('Legendarna', 'Legendary') };

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
  P('bimber', L('Bimber w lufie', 'Moonshine in the Barrel'), 'common', 5, L('Kula ma w sobie coś z gorzelni. +10% obrażeń za stack.', 'Every bullet smells faintly of the distillery. +10% damage per stack.'), { dmgMul: ['add', 0.10] }),
  P('oko_sokola', L('Oko Sokoła z Dolnego Zadupia', 'Hawkeye of Lower Nowheresville'), 'common', 5, L('Celujesz między oczy sołtysowi. +20% obrażeń w głowę za stack.', 'You aim right between the Village Head\'s eyes. +20% headshot damage per stack.'), { headMul: ['add', 0.20] }),
  P('palce_zdzicha', L('Szybkie Palce Zdzicha', 'Zdzichu\'s Sticky Fingers'), 'common', 4, L('Magazynek wskakuje jak złoto do kieszeni. Przeładowanie o 12% krótsze za stack.', 'Mags slip in like gold into a pocket. Reload 12% faster per stack.'), { reloadMul: ['mul', 0.88] }),
  P('dluga_kiszka', L('Dłuższa Kiszka', 'Extra-Long Sausage'), 'common', 4, L('Pomieści więcej, niż wypada. +20% pojemności magazynka za stack.', 'Holds more than is decent. +20% magazine size per stack.'), { magMul: ['add', 0.20] }),
  P('buty_biedronka', L('Buty z Biedronki', 'Discount-Store Sneakers'), 'common', 4, L('Promocja: 2 w cenie 1, ale biegają za trzy. +6% prędkości za stack.', 'Buy one get one free, and they run like three. +6% move speed per stack.'), { speedMul: ['add', 0.06] }),
  P('zupa_tesciowej', L('Zupa od Teściowej', 'Mother-in-Law\'s Soup'), 'common', 5, L('Tłusta, gęsta, nie do zdarcia. +20 maks. HP i tyle leczy od razu.', 'Greasy, thick and indestructible. +20 max HP, healed instantly.'), { maxHpAdd: ['add', 20] }, { onPick: 20 }),
  P('zeszyt_notatek', L('Zeszyt z Notatkami', 'Little Black Notebook'), 'common', 5, L('Zapisujesz każdego, którego ustrzeliłeś. +12% XP za stack.', 'You write down every guy you\'ve popped. +12% XP per stack.'), { xpMul: ['add', 0.12] }),
  P('kebab_po_robocie', L('Kebab po Robocie', 'After-Shift Kebab'), 'common', 5, L('Z sosem czosnkowym, więc nikt nie chce być blisko. +2 HP za każde zabójstwo.', 'Extra garlic sauce, so nobody wants to get close. +2 HP per kill.'), { killHeal: ['add', 2] }),
  P('magnes_zd', L('Magnes na ZD', 'ZD Magnet'), 'common', 3, L('Kieszenie jak odkurzacz. +50% zasięgu zbierania znajdziek za stack.', 'Pockets like a vacuum cleaner. +50% pickup range per stack.'), { magnetMul: ['add', 0.5] }),
  P('kamizelka_wujka', L('Kamizelka po Wujku', 'Uncle\'s Old Vest'), 'common', 4, L('Wujek twierdził, że kuloodporna. Gang się z nim nie zgadza. -7% otrzymywanych obrażeń za stack.', 'Uncle swore it was bulletproof. The gang begs to differ. -7% damage taken per stack.'), { dmgTaken: ['mul', 0.93] }),

  /* ===== RZADKIE ===== */
  P('zubr_na_kaca', L('Żubr na Kaca', 'Hair of the Bison'), 'rare', 3, L('Rano boli mniej, jak się nie zasypia. +1 HP na sekundę za stack.', 'A Żubr beer for the hangover: mornings hurt less if you never go to bed. +1 HP per second per stack.'), { regen: ['add', 1] }),
  P('amunicja_z_odzysku', L('Amunicja z Odzysku', 'Recycled Ammo'), 'rare', 3, L('Przetopiona z kranów i kołder. +20% obrażeń za stack.', 'Melted down from stolen taps and radiators. +20% damage per stack.'), { dmgMul: ['add', 0.20] }),
  P('tiger_o_polnocy', L('Tiger o Północy', 'Midnight Energy Drink'), 'rare', 3, L('Palec drży, spust tańczy. Strzelasz o 10% szybciej za stack.', 'Finger twitching, trigger dancing. Fire rate +10% per stack.'), { rateMul: ['mul', 0.90] }),
  P('wampir_z_biedronki', L('Wampir z Biedronki', 'Bargain-Bin Vampire'), 'rare', 3, L('Gryzie przez kulę. 5% zadanych obrażeń wraca jako HP za stack.', 'Bites through the bullet. 5% of damage dealt returns as HP per stack.'), { lifesteal: ['add', 0.05] }),
  P('granat_tesciowej', L('Granat Teściowej', 'Mother-in-Law\'s Grenade'), 'rare', 3, L('Teściowa rzuca sama, bez pytania. Automatyczny granat co 14 s (o 3 s krócej za stack).', 'Mother-in-law throws it herself, nobody asked her to. Auto grenade every 14 s (3 s sooner per stack).'),
    { grenadeEvery: ['fast', 14, -3], grenadeDmg: ['best', 70, 20], grenadeRadius: ['best', 4, 0.5] }),
  P('unik_po_piatym', L('Unik po Piątym Piwie', 'Fifth-Beer Dodge'), 'rare', 3, L('Nikt tak nie lawiruje jak człowiek, który nie wie, gdzie jest. +7% szansy na pełny unik za stack.', 'Nobody weaves like a man who has no idea where he is. +7% full dodge chance per stack.'), { dodge: ['add', 0.07] }),
  P('rykoszet_od_sciany', L('Rykoszet od Ściany', 'Off the Wall'), 'rare', 3, L('Kula szuka sobie kolejnego gangstera. +18% szansy na rykoszet za stack.', 'The bullet goes looking for another gangster. +18% ricochet chance per stack.'), { ricochet: ['add', 0.18], ricochetBounces: ['best', 1, 0] }),
  P('echo_w_remizie', L('Echo w Remizie', 'Fire Station Echo'), 'rare', 3, L('Strzał odbija się od ścian i wraca. +10% szansy na darmowy drugi strzał za stack.', 'The shot bounces off the walls and comes back for more. +10% chance of a free second shot per stack.'), { extraShot: ['add', 0.10] }),
  P('chciwosc_soltysa', L('Chciwość Sołtysa', 'Village Head\'s Greed'), 'rare', 3, L('Co gang upuści, to sołtys policzy. +25% ZD z zabójstw za stack.', 'Whatever the gang drops, the Village Head counts. +25% ZD from kills per stack.'), { coinMul: ['add', 0.25] }),

  /* ===== EPICKIE ===== */
  P('czysta_wyborowa', L('Czysta Wyborowa', 'Straight Vodka'), 'epic', 2, L('Siedemdziesiąt procent prawdy w każdej kuli. +40% obrażeń za stack.', 'Seventy percent proof, seventy percent truth in every bullet. +40% damage per stack.'), { dmgMul: ['add', 0.40] }),
  P('dubeltowka_dziadka', L('Dubeltówka Dziadka', 'Grandpa\'s Double-Barrel'), 'epic', 2, L('Dziadek zawsze strzelał dwa razy, na wszelki wypadek. +25% szansy na darmowy drugi strzał za stack.', 'Grandpa always fired twice, just in case. +25% chance of a free second shot per stack.'), { extraShot: ['add', 0.25] }),
  P('halina_czuwa', L('Siostra Halina Czuwa', 'Sister Halina Is Watching'), 'epic', 1, L('Pada trup, wchodzi Halina. Raz na run wstajesz z połową zdrowia.', 'A body drops, Halina walks in. Once per run you get back up with half health.'), { revives: ['add', 1] }),
  P('piwnica_granatow', L('Piwnica Pełna Granatów', 'Cellar Full of Grenades'), 'epic', 2, L('Dziadek po wojnie nie wyrzucał niczego. Automatyczny granat co 7 s, większy wybuch (o 1,5 s krócej za stack).', 'Grandpa never threw anything away after the war. Auto grenade every 7 s, bigger blast (1.5 s sooner per stack).'),
    { grenadeEvery: ['fast', 7, -1.5], grenadeDmg: ['best', 110, 40], grenadeRadius: ['best', 5.5, 1] }),
  P('transfuzja_z_zubra', L('Transfuzja z Żubra', 'Bison Beer Transfusion'), 'epic', 2, L('Krew z trawą bizonią. 12% zadanych obrażeń wraca jako HP za stack.', 'Blood with a shot of bison-grass vodka. 12% of damage dealt returns as HP per stack.'), { lifesteal: ['add', 0.12] }),
  P('bilard_w_remizie', L('Bilard w Remizie', 'Fire Station Billiards'), 'epic', 2, L('Trzy bandy i do łuzy. +35% szansy na rykoszet za stack, kula przeskakuje do dwóch celów.', 'Three cushions and in the pocket. +35% ricochet chance per stack, bullets jump to two targets.'), { ricochet: ['add', 0.35], ricochetBounces: ['best', 2, 0] }),
  P('pancerz_z_kaloryfera', L('Pancerz z Kaloryfera', 'Radiator Armour'), 'epic', 2, L('Żeliwo, 14 żeber, zero ogrzewania. +50 maks. HP i -15% otrzymywanych obrażeń za stack.', 'Cast iron, 14 fins, zero heat. +50 max HP and -15% damage taken per stack.'), { maxHpAdd: ['add', 50], dmgTaken: ['mul', 0.85] }, { onPick: 50 }),
  P('turbopolka', L('Turbopolka', 'Turbo Polka'), 'epic', 1, L('BPM 190, nikt nie nadąża. +15% prędkości i strzelasz o 12% szybciej.', '190 BPM, nobody can keep up. +15% move speed and 12% faster fire.'), { speedMul: ['add', 0.15], rateMul: ['mul', 0.88] }),

  /* ===== LEGENDARNE ===== */
  P('trzy_siodemki', L('Trzy Siódemki', 'Triple Seven'), 'legend', 1, L('Los się uśmiechnął, a gang nie. +75% obrażeń i +50% obrażeń w głowę.', 'Lady Luck smiled. The gang did not. +75% damage and +50% headshot damage.'), { dmgMul: ['add', 0.75], headMul: ['add', 0.5] }),
  P('dyplom_disco', L('Dyplom Uniwersytetu Disco', 'Disco University Diploma'), 'legend', 1, L('Wydział Mordobicia, kierunek Bas i Ołów. XP x2.', 'Faculty of Face-Punching, majoring in Bass and Lead. XP x2.'), { xpMul: ['add', 1.0] }),
  P('lustrzany_bandyta', L('Lustrzany Bandyta', 'Mirror Bandit'), 'legend', 1, L('Drugi ty, tylko z gorszym słuchem. +35% szansy na drugi strzał i +35% na rykoszet (do dwóch celów).', 'A second you, just more tone-deaf. +35% second shot chance and +35% ricochet chance (up to two targets).'), { extraShot: ['add', 0.35], ricochet: ['add', 0.35], ricochetBounces: ['best', 2, 0] }),
  P('dziewiec_zyc_kota', L('Dziewięć Żyć Kota z Remizy', 'Nine Lives of the Fire Station Cat'), 'legend', 1, L('Kot z remizy przeżył gorsze rzeczy. +2 wskrzeszenia i +30 maks. HP.', 'The fire station cat has survived worse. +2 revives and +30 max HP.'), { revives: ['add', 2], maxHpAdd: ['add', 30] }, { onPick: 30 }),
  P('disco_apokalipsa', L('Disco Apokalipsa', 'Disco Apocalypse'), 'legend', 1, L('Dwunasta trąba i kula lustrzana. Granat co 3,5 s, duży wybuch.', 'The twelfth trumpet and a mirror ball. Grenade every 3.5 s, big blast.'), { grenadeEvery: ['fast', 3.5, 0], grenadeDmg: ['best', 170, 0], grenadeRadius: ['best', 7, 0] }),
  P('magazynek_bez_dna', L('Magazynek Bez Dna', 'Bottomless Mag'), 'legend', 1, L('Jakim cudem to się mieści? +60% magazynka, przeładowanie o 40% krótsze, ogień o 15% szybszy.', 'How the hell does it all fit? +60% magazine, 40% faster reload, 15% faster fire.'), { magMul: ['add', 0.6], reloadMul: ['mul', 0.6], rateMul: ['mul', 0.85] }),
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
const num = v => { const s = (Math.round(v * 10) / 10).toString(); return L(s.replace('.', ','), s); };
const LABELS = {
  dmgMul: v => L(`+${pct(v - 1)} obrażeń`, `+${pct(v - 1)} damage`),
  headMul: v => L(`+${pct(v - 1)} obrażeń w głowę`, `+${pct(v - 1)} headshot damage`),
  reloadMul: v => L(`przeładowanie ${pct(1 - v)} szybsze`, `reload ${pct(1 - v)} faster`),
  magMul: v => L(`+${pct(v - 1)} magazynka`, `+${pct(v - 1)} magazine`),
  rateMul: v => L(`ogień ${pct(1 / v - 1)} szybszy`, `fire rate ${pct(1 / v - 1)} faster`),
  speedMul: v => L(`+${pct(v - 1)} prędkości`, `+${pct(v - 1)} move speed`),
  magnetMul: v => L(`+${pct(v - 1)} zasięgu zbierania`, `+${pct(v - 1)} pickup range`),
  maxHpAdd: v => L(`+${Math.round(v)} maks. HP`, `+${Math.round(v)} max HP`),
  dmgTaken: v => L(`-${pct(1 - v)} otrzymywanych obrażeń`, `-${pct(1 - v)} damage taken`),
  dodge: v => L(`${pct(v)} szansy na unik`, `${pct(v)} dodge chance`),
  regen: v => `+${num(v)} HP/s`,
  killHeal: v => L(`+${num(v)} HP za zabójstwo`, `+${num(v)} HP per kill`),
  lifesteal: v => L(`${pct(v)} obrażeń leczy`, `${pct(v)} lifesteal`),
  xpMul: v => `+${pct(v - 1)} XP`,
  coinMul: v => L(`+${pct(v - 1)} ZD z zabójstw`, `+${pct(v - 1)} ZD from kills`),
  extraShot: v => L(`${pct(v)} szansy na drugi strzał`, `${pct(v)} second shot chance`),
  ricochet: v => L(`${pct(v)} szansy na rykoszet`, `${pct(v)} ricochet chance`),
  grenadeEvery: v => L(`granat co ${num(v)} s`, `grenade every ${num(v)} s`),
  revives: v => L(`${v} ${v === 1 ? 'wskrzeszenie' : 'wskrzeszenia'}`, `${v} ${v === 1 ? 'revive' : 'revives'}`),
};
/** Np. "+40% obrażeń · +25% obrażeń w głowę" dla perka wziętego n razy. */
export function describeTotals(perk, n) {
  const base = defaultMods(), m = defaultMods();
  perk.apply(m, n);
  const out = [];
  for (const k in LABELS) if (m[k] !== base[k]) out.push(LABELS[k](m[k]));
  return out.join(' · ');
}
