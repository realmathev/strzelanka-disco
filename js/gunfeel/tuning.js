// Liczby feelingu broni (ds-gunfeel). JEDYNE miejsce strojenia kosmetyki: zmiana tych wartości nie rusza obrażeń,
// kadencji, rozrzutu ani trwałego podrzutu (te są w js/weapons/data, właściciel ds-weapon-data).
// Wyjątek, opisany w TUNING.md: „aim punch” kamery (część odrzutu, która wraca) bierze amplitudę i tempo powrotu
// z danych broni (W.recoil.pitch/yaw/recovery), a tu jest tylko mnożnik `cam.punch` (1 = wartość z danych).
// Bez importów: plik czyta też audio (przez setGunAudio w index.js) i przeglądarka modeli.
//
// Jednostki: metry, sekundy, radiany, Hz. Układ viewmodelu: x w prawo, y w górę, z do tyłu (wylot w −Z).
// Kolejność scalania dla broni: DEF -> CLASS[klasa wg slotu] -> WEAPON[id] (płytkie scalanie per podobiekt).

/** Mnożniki wg opcji „Intensywność błysków i wstrząsów” (opt.fx): [Bezpieczna, Normalna, Maksymalna]. */
export const INTENSITY={
  shake:   [0,   1,   1.45],  // trzęsienie kamery (G.shake: strzał, rana, zabójstwo). Bezpieczna = brak.
  light:   [0,   1,   1.3],   // chwilowe światło błysku wylotowego. Bezpieczna = brak.
  flash:   [.55, 1,   1.2],   // rozmiar sprite'a błysku (sprite zostaje: to wskazówka „strzeliłem”, nie błysk ekranu)
  camPunch:[.6,  1,   1.1],   // kosmetyczna część kopniaka kamery (aim punch z danych NIE jest skalowany, to balans)
  vmKick:  [.85, 1,   1.12],  // kopnięcie modelu broni
  bob:     [.45, 1,   1.1],   // kołysanie kamery przy chodzie
  particles:[.5, 1,   1.5],   // iskry, pył, krew
  smoke:   [.5,  1,   1.4],
  hitStop: [0,   1,   1],     // hit-stop przy zabiciu (dodatkowo opt.hitStop=0 wyłącza w Dostępności)
};

export const GLOBAL={
  ads:{
    xhairFade:1,        // 1 = celownik HUD znika w pełnym ADS
    scopeAt:.86,        // od jakiego postępu ADS (po krzywej) luneta chowa model i pokazuje siatkę
    motion:.22,         // mnożnik sway/bob broni w ADS
    kickPos:.45,        // mnożnik uniesienia modelu w ADS
    kickZ:.22,          // mnożnik cofnięcia modelu w ADS (kolba leży pod okiem: większe cofnięcie wjeżdża w kamerę)
    kickRot:.16,        // mnożnik obrotu modelu w ADS (żeby przyrządy nie uciekały z oka i komora nie wjeżdżała w kadr)
    flash:.35,          // błysk przy oku jest mniejszy
    flashScope:.18,     // w lunecie jeszcze mniejszy (powiększenie)
    smoke:.35,          // dym w ADS (nie zasłania przyrządów), w lunecie 0
    camBob:.25,         // kołysanie kamery w ADS
    blockOnReload:true, // przeładowanie wyprowadza z ADS
    moveFallback:.6,    // mnożnik prędkości w ADS, gdy broń nie ma moveMult/moveMultAds
    exitRate:1.25,      // wyjście z ADS szybciej niż wejście (x adsTime^-1)
    vmFovComp:1,        // 1 = broń w ADS nie jest powiększana przez zoom (jak osobny FOV viewmodelu), 0 = powiększana razem ze światem
    // BALANS (most do danych): kąt rozrzutu w pełnym ADS = W.spread * W.adsSpread (gdy dane go nie mają: ta wartość).
    // Działa dopiero, gdy weapons/fire.js pomnoży rozrzut przez DS.player.spreadMul() (docs/requests/ds-gunfeel.md #1).
    spread:.5,
  },
  recoil:{
    applyRate:42,       // [1/s] jak szybko trwały podrzut z fire.js (W.pitchKick) „dojeżdża” do celownika (suma bez zmian)
    jitter:.16,         // losowa składowa wzorca (±16%)
    maxKicks:8,         // ile krzywych kopniaka sumuje się naraz
    burstGap:1.7,       // strzały bliżej niż rate*burstGap liczą się do serii (dryf wzorca)
    camFreq:13,         // [Hz] sprężyna kamery goniąca impuls aim punch (ciężar, lekkie przeregulowanie)
    camDamp:.55,
  },
  shake:{scale:.026, freq:[19,23,13], rollMul:.6},  // [rad na jednostkę G.shake], szum z sinusów zamiast losowania co klatkę
  sway:{look:.00055, lookY:.0005, rot:.022, rotY:.018, max:.03, maxRot:.09, freq:4.2, damp:.62, strafe:.012, strafeRoll:.045},
  bob:{x:.010, y:.008, rotZ:.014, rotX:.006, sprint:1.7, smooth:7, cam:.026, camRoll:.0035},
  sprint:{pos:[-.045,-.075,.04], rot:[-.22,.62,.26], rate:7, afterShot:.4, minSpeed:8},
  jump:{lift:-.022, land:.0065, landMax:.06, camLand:.0045, camMax:.05, freq:5.2, damp:.48},
  breath:{f1:.23, f2:.61, f3:.17, moveMul:.12},     // oddychanie w ADS: częstotliwości [Hz]; amplituda per broń (breath/breathScope)
  draw:{y:-.24, rotX:-1.05, rotZ:.4, x:.03},
  // Poza przeładowania (cała broń) wg typu akcji: przesunięcie [m] i obrót [rad] (x = lufa w górę, y = lufa do środka ekranu, z = przechył).
  reload:{magDrop:.24, magFwd:.03, pose:{
    pistol:  {pos:[-.05,.05,.0],   rot:[.32,.16,.3]},
    mag:     {pos:[-.05,-.01,.02], rot:[.14,.12,.48]},
    revolver:{pos:[-.05,.04,.0],   rot:[.25,.16,.55]},
    pump:    {pos:[-.05,.0,.02],   rot:[.14,.12,-.6]},
    bolt:    {pos:[-.05,.0,.02],   rot:[.1,.12,.42]},
    belt:    {pos:[-.06,.0,.02],   rot:[.12,.14,.34]},
  }},
  light:{color:0xffc56a, distance:7.5, decay:2},
  smoke:{life:1.05, rise:.42, size:.16, grow:.6, opacity:.3, color:0xd8d0c0, burstAfter:6},
  shells:{life:2.6, gravity:-9.8, bounce:.36, friction:.55, eject:[1.7,1.25,.35], jitter:.35, spin:28, sound:.07},
  tracer:{speed:240, len:2.4, width:.014},
  particles:{gravity:-7.5, drag:2.2},
  hit:{
    stopMs:34,          // hit-stop przy zabiciu [ms], twardy limit 40
    stopHeadMs:40,
    killMarker:.36, headRing:.24, markerSize:13, markerGap:7,
    onomaChance:.28, onomaCooldown:.45,                          // komiksowe „PAC!” przy trafieniu (opt.onoma)
    blood:9, bloodHead:16, decalSize:.11, decalMax:64,
  },
  sound:{hitDelayPerM:.0011, hitDelayMax:.035, impactDelayPerM:.0029, impactDelayMax:.09},
};

/** Powierzchnie trafień (rozpoznanie po kolorze wierzchołka i normalnej, patrz fx.js: surfaceOf). */
export const SURFACES={
  stone:  {sparks:5, chunks:6, chunk:0xcfc4ae, spark:0xffe58a, decal:1},
  metal:  {sparks:12, chunks:1, chunk:0x6d6d72, spark:0xfff2b0, decal:1},
  wood:   {sparks:0, chunks:8, chunk:0x8a5a33, spark:0xffd27a, decal:1},
  ground: {sparks:1, chunks:9, chunk:0xa89676, spark:0xffe58a, decal:1},
  foliage:{sparks:0, chunks:7, chunk:0x5f8a3a, spark:0xffe58a, decal:0},
};

/** Wartości domyślne każdej broni. */
const DEF={
  action:'mag',                 // mag | pistol | revolver | pump | bolt | belt | none (cykl i fazy przeładowania)
  hip:[.22,-.2,-.42], hipRot:[0,0,0],
  pivot:[0,-.06,.08],           // punkt obrotu kopniaka (chwyt/ramię), układ modelu
  adsFov:null, adsTime:null,    // null = z danych broni (W.adsFov, W.adsTime)
  adsOffset:[0,0,0],            // korekta punktu oka (dodawana do sightAnchor)
  anchor:null,                  // zastępczy sightAnchor dla modeli bez niego (legacy)
  kick:{z:.035, y:.008, rx:.06, ry:.025, rz:.035, freq:10, damp:.48, curveZ:.022, curveRx:.04, attack:.014, decay:.1, drift:.0},
  cam:{punch:1, kick:.0035, shakeKeep:.45},  // punch: mnożnik aim punch z danych; kick: kosmetyczny podrzut kamery [rad]; shakeKeep: ile W.shake zostaje
  patterns:[{p:1,y:.25,r:.3,z:1},{p:.92,y:-.35,r:-.25,z:1.05},{p:1.08,y:.05,r:.45,z:.95},{p:.97,y:-.12,r:-.4,z:1}],
  flash:{size:.26, light:2.4, dur:.045, smoke:.35},
  shell:'r556',                 // p9 | p45 | r556 | r762 | r762R | g12 | none
  shellDelay:.012,
  cycle:{travel:.03, back:.012, ret:.05, trig:.32},
  draw:.42,
  sway:1,                       // mnożnik masy w sway (cięższa broń = większe opóźnienie)
  breath:.0011, breathScope:.0032,
  tracerEvery:1,
  reload:null,                  // nadpisanie faz przeładowania (patrz anim.js: PHASES)
};

/** Klasy wg slotu: 1 pistolety, 2 PM, 3 strzelby, 4 karabiny, 5 wyborowe, 6 LKM. */
export const CLASS={
  pistol:{
    action:'pistol', hip:[.2,-.19,-.4], pivot:[0,-.07,.03], adsOffset:[0,0,-.1],
    kick:{z:.042, y:.012, rx:.17, ry:.03, rz:.05, freq:9, damp:.42, curveZ:.028, curveRx:.13, attack:.016, decay:.16},
    cam:{kick:.004, shakeKeep:.5},
    patterns:[{p:1,y:.2,r:.35,z:1},{p:.9,y:-.35,r:-.2,z:1.05},{p:1.1,y:.05,r:.5,z:.95},{p:.95,y:-.1,r:-.4,z:1}],
    flash:{size:.22, light:2.1, dur:.042, smoke:.55}, shell:'p9', cycle:{travel:.03, back:.01, ret:.055, trig:.35},
    draw:.32, sway:.7, breath:.0012, tracerEvery:1,
  },
  smg:{
    hip:[.21,-.2,-.42], pivot:[0,-.06,.1], adsOffset:[0,0,-.03],
    kick:{z:.026, y:.006, rx:.05, ry:.026, rz:.03, freq:12, damp:.5, curveZ:.018, curveRx:.03, attack:.012, decay:.075, drift:.6},
    cam:{kick:.0022, shakeKeep:.35},
    patterns:[{p:1,y:.4,r:.3,z:1},{p:.9,y:-.45,r:-.3,z:1.05},{p:1.1,y:.1,r:.2,z:.95},{p:.95,y:-.2,r:-.35,z:1},{p:1.05,y:.55,r:.1,z:.9}],
    flash:{size:.21, light:1.8, dur:.038, smoke:.22}, shell:'p9', cycle:{travel:.03, back:.008, ret:.04, trig:.3},
    draw:.38, sway:.85, breath:.0011, tracerEvery:2,
  },
  shotgun:{
    hip:[.22,-.2,-.42], pivot:[0,-.12,.25], adsOffset:[0,0,-.13],
    kick:{z:.085, y:.02, rx:.3, ry:.05, rz:.09, freq:6.5, damp:.38, curveZ:.06, curveRx:.24, attack:.02, decay:.3},
    cam:{kick:.007, shakeKeep:.6},
    patterns:[{p:1,y:.3,r:.4,z:1},{p:.92,y:-.3,r:-.3,z:1.08},{p:1.08,y:0,r:.55,z:.95}],
    flash:{size:.42, light:3.2, dur:.06, smoke:1}, shell:'g12', cycle:{travel:.075, back:.02, ret:.08, trig:.35},
    draw:.5, sway:1.15, breath:.0012, tracerEvery:3,
  },
  rifle:{
    hip:[.21,-.2,-.42], pivot:[0,-.1,.22], adsOffset:[0,0,-.05],
    kick:{z:.036, y:.007, rx:.07, ry:.03, rz:.035, freq:10, damp:.48, curveZ:.024, curveRx:.045, attack:.014, decay:.1, drift:.5},
    cam:{kick:.0028, shakeKeep:.4},
    flash:{size:.27, light:2.4, dur:.04, smoke:.32}, shell:'r556',
    draw:.45, sway:1, breath:.0011, tracerEvery:2,
  },
  marksman:{
    hip:[.22,-.2,-.42], pivot:[0,-.1,.22], adsOffset:[0,0,-.04],
    kick:{z:.065, y:.014, rx:.19, ry:.04, rz:.06, freq:7, damp:.4, curveZ:.05, curveRx:.16, attack:.018, decay:.26},
    cam:{kick:.0055, shakeKeep:.5},
    patterns:[{p:1,y:.25,r:.3,z:1},{p:.94,y:-.3,r:-.3,z:1.05},{p:1.06,y:.05,r:.4,z:.97}],
    flash:{size:.33, light:2.8, dur:.05, smoke:.7}, shell:'r762R',
    draw:.55, sway:1.25, breath:.0015, breathScope:.0034, tracerEvery:1,
  },
  mg:{
    hip:[.2,-.21,-.42], pivot:[0,-.1,.22], adsOffset:[0,0,-.06],
    kick:{z:.042, y:.008, rx:.06, ry:.04, rz:.04, freq:8.5, damp:.45, curveZ:.028, curveRx:.05, attack:.014, decay:.12, drift:.8},
    cam:{kick:.003, shakeKeep:.45},
    patterns:[{p:1,y:.5,r:.3,z:1},{p:.9,y:-.55,r:-.3,z:1.05},{p:1.1,y:.15,r:.25,z:.95},{p:.95,y:-.25,r:-.4,z:1}],
    flash:{size:.31, light:2.6, dur:.042, smoke:.25}, shell:'r762R',
    draw:.7, sway:1.6, breath:.0013, tracerEvery:3,
  },
};

/** Nadpisania per broń (tylko różnice względem klasy). */
export const WEAPON={
  // legacy (bez nazwanych części i sightAnchor: punkt oka podany ręcznie)
  pistol:{anchor:[0,.088,.25], action:'none'},
  shotgun:{anchor:[0,.072,.36], action:'none', shell:'g12'},
  rifle:{anchor:[0,.105,.33], action:'none'},
  // pistolety
  glock17:{},
  p83wanad:{kick:{z:.036, rx:.13}, shell:'p9'},
  deagle50:{kick:{z:.062, y:.018, rx:.3, ry:.05, rz:.08, freq:7.5, damp:.38, curveZ:.045, curveRx:.24, attack:.018, decay:.24},
    cam:{kick:.0065, shakeKeep:.7}, flash:{size:.34, light:3, dur:.055, smoke:.9}, shell:'p45', cycle:{travel:.045, back:.012, ret:.07, trig:.3}},
  python357:{action:'revolver', shell:'none', kick:{z:.05, y:.014, rx:.24, ry:.04, rz:.06, freq:8, damp:.4, curveZ:.035, curveRx:.19, attack:.017, decay:.2},
    cam:{kick:.0055, shakeKeep:.6}, flash:{size:.3, light:2.8, dur:.05, smoke:.8}},
  // pistolety maszynowe
  uzi:{}, mp5a3:{kick:{z:.022, rx:.04, freq:13}}, pm63rak:{kick:{z:.03, rx:.06}, cycle:{travel:.035, back:.008, ret:.045, trig:.3}},
  // strzelby
  mossberg500:{action:'pump', shellDelay:-1 /* łuska przy pompowaniu */},
  saiga12:{kick:{z:.07, rx:.24, decay:.22}, flash:{size:.38}},
  // karabiny
  akm:{shell:'r762', kick:{z:.042, rx:.085, ry:.036, drift:.7}, flash:{size:.3, light:2.6}},
  m4a1:{}, beryl96:{},
  // wyborowe
  svd:{},
  mosin9130:{action:'bolt', shellDelay:-1, kick:{z:.075, rx:.24, freq:6.2, decay:.32}, flash:{size:.38, light:3.1, smoke:1}},
  // LKM
  pkm:{action:'belt'},
};

/** Dźwięk: profile kalibrów (proceduralne warstwy, patrz audio/gunsfx.js). Głośności 0..1 przed suwakiem „Efekty”. */
export const AUDIO={
  calibers:{
    // crack: trzask naddźwiękowy/wylotowy (szum przez filtr), thump: dudnienie (sinus z opadającą częstotliwością),
    // body: korpus (szum dolnoprzepustowy), tail: ile idzie do pogłosu, mech: klik mechanizmu tuż po strzale.
    p9:   {crack:{hp:2200, bp:3600, q:.8, dur:.05, vol:.55}, thump:{f0:150, f1:52, dur:.11, vol:.75}, body:{lp:2300, dur:.14, vol:.6},  tail:.24, mech:{d:.03, f:3200, vol:.12}},
    p9m:  {crack:{hp:2000, bp:3200, q:.8, dur:.05, vol:.5},  thump:{f0:140, f1:50, dur:.11, vol:.7},  body:{lp:2100, dur:.13, vol:.55}, tail:.22, mech:{d:.03, f:3000, vol:.12}},
    p50:  {crack:{hp:1500, bp:2400, q:.7, dur:.07, vol:.7},  thump:{f0:120, f1:38, dur:.2,  vol:1},   body:{lp:1700, dur:.24, vol:.85}, tail:.34, mech:{d:.04, f:2600, vol:.14}},
    p357: {crack:{hp:2400, bp:4200, q:.9, dur:.06, vol:.75}, thump:{f0:135, f1:44, dur:.16, vol:.9},  body:{lp:2600, dur:.18, vol:.75}, tail:.32, mech:{d:.02, f:4200, vol:.1}},
    smg9: {crack:{hp:2400, bp:3800, q:.9, dur:.035,vol:.45}, thump:{f0:150, f1:60, dur:.07, vol:.55}, body:{lp:2800, dur:.08, vol:.5},  tail:.16, mech:{d:.02, f:3400, vol:.1}},
    g12:  {crack:{hp:900,  bp:1600, q:.6, dur:.09, vol:.7},  thump:{f0:105, f1:32, dur:.32, vol:1},   body:{lp:1400, dur:.42, vol:.95}, tail:.4,  mech:{d:0, f:0, vol:0}},
    r556: {crack:{hp:3200, bp:5200, q:1,  dur:.04, vol:.7},  thump:{f0:125, f1:48, dur:.09, vol:.6},  body:{lp:3000, dur:.12, vol:.55}, tail:.26, mech:{d:.02, f:3600, vol:.08}},
    r762: {crack:{hp:2600, bp:4200, q:.9, dur:.05, vol:.75}, thump:{f0:110, f1:40, dur:.13, vol:.8},  body:{lp:2400, dur:.15, vol:.7},  tail:.3,  mech:{d:.02, f:3000, vol:.08}},
    r762R:{crack:{hp:2800, bp:4600, q:1,  dur:.06, vol:.85}, thump:{f0:100, f1:34, dur:.18, vol:.95}, body:{lp:2200, dur:.2,  vol:.8},  tail:.38, mech:{d:.03, f:2800, vol:.1}},
  },
  weapon:{pistol:'p9', shotgun:'g12', rifle:'r762', glock17:'p9', p83wanad:'p9m', deagle50:'p50', python357:'p357', uzi:'smg9', mp5a3:'smg9', pm63rak:'p9m',
    mossberg500:'g12', saiga12:'g12', akm:'r762', m4a1:'r556', beryl96:'r556', svd:'r762R', mosin9130:'r762R', pkm:'r762R'},
  byName:{pistol:'p9', smg:'smg9', shotgun:'g12', rifle:'r762'},   // gdy nie wiadomo, która broń (np. granat z perku woła 'shotgun')
  room:{default:{ir:1.3, decay:3.2, wet:1}, remiza:{ir:1.5, decay:3, wet:1}},
  rand:{pitch:.035, vol:.08},
  shotVol:.68,     // wspólna głośność strzałów gracza (szczyt ok. 0,55-0,9 przed kompresorem; dawne dźwięki 0,45-0,76)
  mech:1,          // głośność klików mechaniki (przeładowanie, pompka, zamek)
  enemy:{near:9000, far:1100, farDist:45, vol:.5},   // strzały wrogów: dolnoprzepustowy wg odległości
  hit:1,           // mnożnik dźwięku trafienia (dodatkowo opt.hitVol)
};

/* ───────────────── resolver ───────────────── */
export const CLASS_BY_SLOT=[null,'pistol','smg','shotgun','rifle','marksman','mg'];
const cache=new Map();
function merge(dst,src){if(!src)return dst;for(const k in src){const v=src[k];
  if(v&&typeof v==='object'&&!Array.isArray(v)&&dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k]))dst[k]=Object.assign({},dst[k],v);else dst[k]=v}return dst}
/** Scalona konfiguracja feelingu broni `id` (slot z definicji broni W). Wynik jest cache'owany: po zmianie tabel wołaj `invalidate()`. */
export function weaponFeel(id,W){
  let c=cache.get(id);if(c)return c;
  const cls=CLASS_BY_SLOT[W&&W.slot]||'pistol';
  c=merge(merge(merge({},DEF),CLASS[cls]),WEAPON[id]);c.id=id;c.cls=cls;
  cache.set(id,c);return c;
}
export function invalidate(){cache.clear()}
/** Mnożnik intensywności `key` dla bieżącego opt.fx (0/1/2). */
export function fxk(key,fx){const a=INTENSITY[key];if(!a)return 1;const i=fx>=2?2:fx>=1?1:0;return a[i]}
