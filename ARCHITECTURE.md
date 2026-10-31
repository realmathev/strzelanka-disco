# Disco Strzelnica: architektura

Three.js r128 jako globalny `THREE` z CDN, moduły ES bez bundlera. Lokalnie potrzebny serwer:
`npx -y serve disco-strzelnica` albo `node disco-strzelnica/tests/serve.js [port]` (z `file://` moduły się nie załadują).
Debug w konsoli: `window.DS`.

## Układ plików i własność

```
index.html          markup + <script type="module" src="js/main.js">      ds-architect
css/main.css        style                                                  ds-input-menus
js/main.js          importy domen + boot                                   ds-architect
js/core/            util, bus, registry, save (opcje/zapis), difficulty, state, meta (skórki), input (rejestr akcji), ds
js/render/          renderer/scena/kamera, materiały toon + kontury, tekstury canvas, fx3d, comicfx (nakładka 2D), settings
js/audio/           context, music (sekwencer), sfx, init; gunsfx.js -> ds-gunfeel
js/player/          player (ruch, kamera, hooki), collision (collide, los), input (listenery -> akcje)
js/game/            run (S.G), combat, waves, flow (start/pauza/menu), loop
js/weapons/         legacy.js (3 stare bronie), slots.js, viewmodel, fire; data/ -> ds-weapon-data, models/ -> ds-weapon-modeler
js/enemies/         manager (spawn, śmierć, trudność), gangster.js          ds-enemy-designer
js/world/           state, build (addBox, building), batch (scalanie), world (loadLevel/clearLevel, animateWorld)
js/world/props/     rekwizyty (lib.js = defProp/Parts/instance)            ds-world-modeler
js/world/levels/    poziomy                                                ds-level-designer
js/pickups/         znajdźki, leczenie, pancerz, automaty, dropy           ds-healing
js/progression/     XP, poziomy, perki (BALANCE.md)                        ds-progression
js/gunfeel/         stub                                                   ds-gunfeel
js/input/           domyślne akcje, rebind, warstwa działania akcji        ds-input-menus
js/ui/              ekrany, HUD, opcje, sklep, kasyno, skrzynki            ds-input-menus
```

Każdy katalog domeny ma `index.js`. Nowy plik dopisujesz importem we **własnym** `index.js`,
nie w `main.js`. Kolejność ładowania domen: core, render, audio, world, player, weapons, enemies,
pickups, input, progression, gunfeel, ui, game. Potem boot: `loadLevel(opt.level || 'remiza')`, `applyOpts()`, `loop()`.

### Zasady modułów

- Moduły tworzą cykle importów (game <-> ui <-> weapons). Bezpieczne, bo **na poziomie modułu** wolno
  używać tylko importów z `core/`, `render/`, `audio/`, `world/state.js`. Resztę wołaj wewnątrz funkcji.
  Eksportuj funkcje jako `function` (są hoistowane), nie `const f=()=>`.
- Zmienny stan wspólny: `S` z `core/state.js` (`S.G` bieżący run albo `null`, `S.mode`: `'warn'|'menu'|'game'`,
  `S.mouseDown`). Importu nie da się przypisać, więc pisz `S.G=...`, nie `G=...`.
- `save` i `opt` to stałe obiekty: mutuj pola, potem `persist()` / `persistOpt()`.
  Klucze localStorage `discoStrzelnica.save.v1` i `discoStrzelnica.opt.v1` się **nie zmieniają**;
  nowe pola dodawaj do `DEF_SAVE`/`DEF_OPT` (albo `OPT_DEFAULTS` w `input/optdefs.js`); stare zapisy dostaną wartości domyślne.
  Migracje zapisu robi `core/save.js` przy wczytaniu (dziś: broń `smg` -> `uzi`).

## Rejestry

Wszystkie w `DS` (`import {DS} from '../core/ds.js'`). API: `register(def)`, `get(id)`, `has(id)`,
`remove(id)`, `ids()`, `all()`. Kolejność rejestracji = kolejność w `ids()`. Ten sam `id` nadpisuje
definicję w tym samym miejscu (tak nowe dane mogą zastąpić stare bronie).

### `DS.weapons`
```js
DS.weapons.register({
  id:'glock17', name:'Glock 17', short:'Glock', price:350,
  slot:1,                       // slot 1-6: klawisz 1-6 (patrz niżej); key jest nadpisywane = String(slot)
  dmg:34, rate:.3 /*s między strzałami*/, mag:17, reload:1.1 /*s*/, spread:.006, pellets:1, auto:false,
  snd:'BANG!' /*napis komiksowy*/, sfx:'pistol' /*nazwa w audio/sfx*/,
  kick:.45 /*kopnięcie viewmodelu*/, pitchKick:.012 /*rad, trwały podrzut*/, shake:.08, burst:false,
  // Model: wylotem w −Z, metry, układ viewmodelu. B(w,h,d,x,y,z,mat,rx) = box z konturem.
  model({B, group, mat1, mat2, muzzle, hull}){ B(.03,.13,.19,0,0,-.1,mat1); muzzle.set(0,.02,-.2); },
});
```
**Sloty i klawisze** (`weapons/slots.js`): klawisze **1-6 wybierają slot**, nie broń: 1 pistolety, 2 pistolety maszynowe, 3 strzelby,
4 karabiny, 5 wyborowe, 6 karabiny maszynowe. Akcje `weapon1..weapon6` (rebindowalne). Gdy bieżąca broń jest z tego slotu,
klawisz przełącza na następną posiadaną broń slotu; w przeciwnym razie wraca do ostatnio używanej broni slotu
(`G.slotLast[slot]`) albo pierwszej posiadanej. Kółko myszy (`weaponNext/Prev`) idzie po posiadanych broniach posortowanych wg slotu.
Pomocnicze (`weapons/slots.js`): `slotOf(id)`, `slotWeapons(slot)`, `ownedWeapons()`, `weaponsBySlot()`, `weaponKeyHint(id)`
(„klawisz 2 (pistolety maszynowe)”, z aktualnych przypisań; używa tego sklep i ekwipunek). `selectSlot(n)` w `weapons/fire.js`.
**Aliasy zapisu:** `WEAPON_ALIAS = {smg:'uzi'}` (`canonWeapon(id)`): legacy Uzi „Weselne” (`smg`) zniknęło z rejestru, stare zapisy
migrują do `uzi` (core/save.js), a `switchWeapon('smg')` też działa.

**Modele broni (kontrakt, ds-weapon-modeler/ds-gunfeel).** `def.model(ctx)` buduje viewmodel (jak wyżej). Na definicji bywają
dodatkowo: `getViewModel(mats?)`, `getWorldModel(mats?)` (model świata, ≤300 tri), `sightAnchor`, `sightRear`, `sightFront`
(Vector3, metry, układ modelu = układ `group` z `buildGun`), `modelTris()`. `group.userData` po `model()`: `parts`, `muzzle`,
`sightAnchor`, `sightRear`, `sightFront`, `eyeRelief`, `anim(t)`; części nazwane (`getObjectByName`): `muzzle`, `ejectionPort`,
`sightAnchor`, `magazine`, `slide`, `trigger` (Python: `hammer`, `cylinderSwing`, zagnieżdżony `cylinder`). Spoczynek części:
`part.userData.p0`. **ADS:** `sightAnchor` to punkt OKA (na linii celowania `eyeRelief` ≈ 0,19-0,23 m za szczerbinką): ustaw viewmodel tak,
by `gunRoot.position + sightAnchor` (z obrotem) wypadło w początku kamery; oko -> szczerbinka -> muszka leży wtedy na osi −Z.
Skórki: `mat1` (zamek/lufa/rama) i `mat2` (szkielet) to współdzielone `gunMat1/gunMat2`; okładziny i muszki mają własne stałe materiały.
**Czas życia (`weapons/viewmodel.js: buildGun`):** broń bez `model()` dostaje zastępczy klocek (gra się nie wywala); stary model jest zwalniany
przez `disposeObject` razem z wpisami w `outlines`. **Nie zwalniane** (współdzielone): geometrie z `geometry.userData.shared=true`
(bufory kitów: `pistol-kit`, `long-kit`, `marksman-kit` scalają geometrie per materiał i cache'ują je w blueprintach), materiały z
`material.userData.shared=true` (`KM.*`, `gunMat1/2`), `inkMat`, `lineMat`. Nowy model, który cache'uje geometrię/materiał między
wywołaniami, **musi** je tak oznaczyć (zwolnienie nieoznaczonego i tak jest bezpieczne, tylko wgrywa się ponownie na GPU).

### `DS.enemies`
```js
DS.enemies.register({
  id:'dres',
  create({boss, wave}){ /* zwraca e: {g:Group, meshes:[trafialne], mats, hp, maxHp, radius, alive:true, dieT:0, boss, headY, dmg} */ },
  update(e, dt, eye){ /* AI żywego wroga; eye = Vector3 oczu gracza (nie zapisuj referencji) */ },
  dying(e, dt){ /* opcjonalnie: animacja śmierci; musi zwiększać e.dieT, po 5 s manager usuwa */ },
});
spawnEnemy('dres', {boss:false});   // z enemies/manager.js
```
Mesh trafialny: `mesh.userData.part = 'head' | 'body'`; manager ustawia `mesh.userData.enemy = e`.
**Trudność:** `spawnEnemy` mnoży `e.hp`, `e.maxHp` i `e.dmg` (jeśli liczba) przez `diffMul()` z `core/difficulty.js`
(`opt.difficulty`: easy 0,75/0,75, normal 1/1, hard 1,35/1,25 dla HP/obrażeń). `create()` zwraca wartości bazowe; obrażenia gracza zadawaj
przez `hurt(e.dmg*...)` z `game/combat.js`.

### `DS.levels`, `DS.props`
```js
DS.props.register({id:'trzepak', place({x, z, rotY}){ /* buduje, dodaje do sceny, zwraca Object3D */ }});
DS.levels.register({
  id:'blokowisko', name:'Blokowisko', arena:60, spawn:{x:0,z:40,yaw:0}, menuCam:{r:30,y:8,look:[0,4,0]},
  build(world){ DS.props.get('trzepak').place({x:3, z:5}); },
});
loadLevel('blokowisko');   // world/world.js
```
**Ładowanie i sprzątanie poziomu (`world/world.js`).** `loadLevel(id)` najpierw woła `clearLevel()`, potem `build(world)` i `flushBatches()`;
zapamiętuje obiekty dodane do sceny w trakcie budowy (diff `scene.children`). `clearLevel()` emituje `levelUnload`, czyści kubełki `batch.js`,
`DS.props.resetDecals()`, zwalnia obiekty poziomu (`disposeObject`: geometrie, materiały bez `shared`, instancje, wpisy `outlines`; tekstury szyldów)
i zeruje `world.colliders/meshes/neon/bulbs`. Dzięki temu poziomy można przełączać i wczytywać ponownie bez wycieku (scena, geometrie, kolidery
wracają do stanu wyjściowego; statyczne części są budowane od nowa). **Wymagania wobec `build()`:** wszystko, co poziom dodaje do sceny, musi być w
`world.*` albo samo wpisywać się w scenę podczas `build()` (diff to wyłapie); własne obiekty poza sceną sprzątaj na `DS.bus.on('levelUnload')`
(przykład: `pickups/machines.js` -> `clearHealMachines`). Nie wołaj `loadLevel` w trakcie runu (`S.mode==='game'`). Wybór w menu
(`opt.level`, zdarzenie `levelSelect {level}`) wczytuje poziom od razu (nasłuch w `world.js`); `startGame` wczytuje wybrany poziom, jeśli jeszcze nie jest aktywny.
Boot: `loadLevel(opt.level)` (a gdy go nie ma w rejestrze: `'remiza'`).

**Geometria statyczna: `addBox(...)` z `world/build.js`** dopisuje collider do `world.colliders`, a geometrię do kubełków `world/batch.js` (`loadLevel`
po `build()` skleja je w siatki per kafelek 16x16 m i dopiero te trafiają do `world.meshes`). Uwaga: **zwrócony przez `addBox` obiekt to niewidoczna
zaślepka (pozycja + `userData.box`), nie ma jej w scenie**: nie dopinaj do niej dzieci ani materiałów, nie rób `scene.remove`. Z materiału liczy się tylko
`color` i `map.repeat` (okna), kolor idzie w atrybutach wierzchołków; inne części: `addPart(geo, matrix4, mat, opts)` (cast, receive, ray, hull, edges:false,
basic, group). Ręcznie: `world.colliders.push({x0,x1,z0,z1,h})`, `world.meshes.push(mesh)`.

**Rekwizyty (`world/props/lib.js`, ds-world-modeler).** `defProp(id, meta, (P, o, r) => {...})` rejestruje w `DS.props` definicję
`{id, name, cat, dims, variants, note, parts(opts), make(opts), place(opts)}`; `P` to `Parts` (`box/cyl/cylc/sph/ico/lathe/prism/decal/decalGeo/neon/col/colBox`,
`P.cover`), `r` to deterministyczny `rng(seed)`.
- `DS.props.get(id).place({x,y,z,rotY,seed,variant,collide})`: wkłada części do świata przez `addPart` (scalanie w kafelki), kolidery do `world.colliders`
  (chyba że `collide:false`), neony do sceny i `world.neon`, decale do jednej siatki świata. Zwraca zaślepkę `Object3D` z `userData:{id, seed, collider, cover}`.
- `.make(opts)`: samodzielna `Group` (viewer, podgląd, testy); origin = środek podstawy, „twarz” w +Z (auta: przód w −Z);
  `userData:{id, seed, collider, cover, tris, ink, declared}`. Nie dodaje do `world.*`.
- `DS.props.instance(id, [{x,z,rotY,s,y},...], {seed, opts, collide})`: `InstancedMesh` dla powtarzalnych rekwizytów (latarnie, ławki), kontury
  tylko jako kadłub, bez decali i neonów; zwraca `Group` w scenie (sprzątana przez `clearLevel`).
- `DS.props.resetDecals()`: czyści decale rekwizytów (jedna wspólna siatka); `loadLevel/clearLevel` woła to sam.
- Szyldy neonowe: prop `neonSign` (legacy) albo `P.neon(...)`; trafiają do `world.neon`, migotanie = przygaszenie koloru w `animateWorld` (`static:true` = nie mruga).
- Jednostki: metry, rzeczywiste wymiary (`meta.dims`). Auta: szerokość nadwozia = wymiar rzeczywisty, lusterka (`mirror()` w `cars.js`) dodają ~6 cm na stronę.

### `DS.pickups`
```js
DS.pickups.register({id:'kebab', magnet:3, mesh(){ return new THREE.Mesh(geo, mat) }, spin(m, dt){}, collect(p){ /* p.val */ }});
spawnPickup('kebab', position, 25);  // z pickups/pickups.js
```
Dropy z wrogów losuje `pickups/drops.js` ze zdarzenia `kill` (szansa rośnie przy niskim HP); `game/combat.js` nie dropi już apteczek.
Automaty/stacje leczenia: `placeHealMachine({kind:'vending'|'station', x, z, rotY})` w `build()` poziomu; sprzątane na `levelUnload`.

### `DS.perks`
Faktyczny kształt (ds-progression): `{id, name, rarity:'common'|'rare'|'epic'|'legend', max, desc, apply(mods, n, G)}`;
`apply` modyfikuje jedyny obiekt `G.mods` (pola i `defaultMods()` w `progression/catalog.js`), `n` = liczba stacków.
Dane runu: `DS.progression.state()`, `.owned()`, `.mods()`; perk: `DS.perks.get(id)`.

### `DS.input` (akcje i rebind)
```js
DS.input.register({id:'ads', label:'Celowanie', codes:['Mouse2']});
DS.input.isDown('sprint');            // stan ciągły (tryb „przełącz” uwzględniony dla ads/sprint/crouch)
DS.input.pressed('melee');            // prawda w klatce wciśnięcia
DS.input.matches('reload', e.code);   // czy kod wyzwala akcję
DS.input.keyFor('use'); DS.input.labelFor('use'); // etykiety do UI (z aktualnych przypisań)
DS.input.bind('jump', ['Space','KeyC']); DS.input.reset(); DS.input.conflicts(); // {code:[actionIds]}
DS.input.serialize() / DS.input.load(map) // zapis przypisań (opt.keys, robi to input/actions.js: saveKeys)
DS.input.sensitivity();               // opt.sens, w ADS razy opt.adsSens; używa tego player/input.js
```
Kody: `KeyboardEvent.code`, `Mouse0/1/2`, `WheelUp/WheelDown`. Akcje (`js/input/actions.js`, **jedyne miejsce definicji**, także `use`):
moveForward, moveBack, moveLeft, moveRight, sprint, jump, crouch, fire, ads, reload, melee, weaponNext, weaponPrev,
**weapon1-weapon6 (sloty broni)**, use (E, automaty), medkit, perkMenu, pause. Aliasy snake_case (`move_fwd`, `weapon_1`...) działają we wszystkich metodach.
Moduły czytają akcje przez `DS.input` (nie rejestrują własnych, żeby nie dublować i żeby były w Sterowaniu); nowa akcja: dopisz do tablicy `A` w `actions.js`
z `group`.

## Zdarzenia (`DS.bus.on(name, fn)` zwraca funkcję wypisującą; `emit(name, payload)`)

| zdarzenie | payload | kiedy |
|---|---|---|
| `shot` | `{weapon, def, hit, muzzle}` | po każdym strzale gracza |
| `hit` | `{enemy, dmg, head, point}` | trafienie wroga |
| `kill` | `{enemy, head, value, combo}` | zabójstwo |
| `damage` | `{amount, hp}` | gracz oberwał; `amount` = obrażenia, które trafiły w **HP** (po pancerzu), `hp` = HP po ciosie |
| `heal` | `{amount, source}` | leczenie; `source`: `'pickup'` (med, bandaż, adrenalina, jedzenie, automaty), `'medkit'`, `'revive'`, `'perk'` (kradzież życia, leczenie z zabójstw) |
| `armor` | `{armor, max}` | zmiana pancerza (kamizelka, pochłanianie, regeneracja tarczy); HUD rysuje pasek (ukryty przy `max=0`) |
| `xp` | `{xp, level, next, gain, total}` | po każdym przyroście XP i na `levelStart` (reset: xp 0, level 1). `xp` = postęp w bieżącym poziomie (0..next-1), `next` = próg tego poziomu (pasek = `xp/next`), `gain` = ostatni przyrost, `total` = XP w runie |
| `levelup` | `{level}` | przekroczono próg (nowy numer poziomu); ekran automatu otwiera się ~0,7 s później |
| `perk` | `{id, rarity, stacks, level}` | po wylosowaniu perka w automacie (już zastosowany) |
| `pickup` | `{type, value}` | podniesienie znajdźki |
| `waveStart` | `{wave, boss, count}` | nowa fala |
| `levelStart` | `{level}` | start runu |
| `levelEnd` | `{level, reason:'death'\|'quit', wave, kills, earned}` | sprzątanie runu (raz na run) |
| `pause` | `true` / `false` | pauza / wznowienie; ekran automatu level-up też pauzuje (`G.paused=true`), ale nie pokazuje `scrPause` |
| `levelSelect` | `{level}` | wybór poziomu w menu (ui/menu.js); `world.js` wczytuje go od razu |
| `levelLoad` / `levelUnload` | `{level}` | po `loadLevel` / na początku `clearLevel` (sprzątanie własnych obiektów poziomu) |
| `input:down` / `input:up` | `{action, code}` | wciśnięcie/puszczenie akcji (tylko w grze) |
| `keys` | `opt.keys` | zmiana przypisań klawiszy |
| `update` | `dt` | co klatkę gry (po HUD) |
| `save` | `save` | po `persist()` (UI odświeża portfel) |

Payloady są tworzone na nowo; nie modyfikuj ich i nie zakładaj, że są stałe. (Zaproponowane, jeszcze nieistniejące: `beforeDamage {amount}` i `beforeDeath {cancel}`
w `hurt()`/`die()`, żeby progresja nie cofała śmierci hackiem `lv-noover`; patrz docs/requests/ds-progression.md #2.)

## Hooki feelingu broni (`DS.player`)

```js
DS.player.viewmodel        // THREE.Group przypięta do kamery; broń wylotem w −Z
DS.player.vmOffset.pos/rot // Vector3, DODAWANE po bazowym bobie/odrzucie/przeładowaniu
DS.player.camOffset        // {pitch, yaw, roll, pos:Vector3}, dodawane do kamery co klatkę (np. sprężyna recoilu)
DS.player.fovMul = .7;     // ADS: FOV = opt.fov * fovMul (projekcja liczona tylko przy zmianie)
DS.player.addRecoil(pitch, yaw) // trwały podrzut celownika (zmienia P.pitch/P.yaw)
DS.player.flash, DS.player.muzzleLocal, DS.player.P  // błysk, wylot, stan gracza
DS.player.speedMul()       // mnożnik ruchu (adrenalina x1,35); czyta go updateMovement
DS.player.recoilMul()      // mnożnik odrzutu (adrenalina x0,7): HOOK dla ds-gunfeel
```
Offsety nie są zerowane automatycznie: kto je ustawia, ten je wygasza (np. w `DS.bus.on('update', dt => ...)`).
Kosmetyka (camOffset, vmOffset, shake) ma być oddzielona od balansu (spread, rate, pitchKick).
**Adrenalina:** pickup ustawia `S.G.adrenT` (s, `CFG.adrenaline.time`), timer maleje w `pickups/status.js`. `player.js` mnoży prędkość (marsz i sprint) przez
`DS.player.speedMul()`. **Odrzut zostaje po stronie ds-gunfeel:** mnóż swój podrzut/sprężynę przez `DS.player.recoilMul()`
(dziś `weapons/fire.js` woła `addRecoil(W.pitchKick, 0)` bez mnożnika; gdy gunfeel przejmie odrzut, ma tam użyć `recoilMul()`).

## Opcje (`opt`) i ich skutek

| opcja | skutek |
|---|---|
| `preset, scale, fov, draw, shadows, outlines, panels, onoma, fx, music, sfx, track, invert, sens` | działają |
| `hitVol` | skaluje dźwięki `hit`/`head` (`audio/sfx.js`; domyślne .8 = głośność jak dawniej) |
| `dmgNum` | 0 = brak liczb obrażeń nad wrogami (`combat.damageEnemy`) |
| `difficulty` | mnożniki HP/obrażeń wrogów (`core/difficulty.js`), regeneracja pancerza, XP; zmiana działa na wrogów tworzonych po zmianie |
| `level` | wybrany poziom (`loadLevel`, zdarzenie `levelSelect`) |
| `sprintMode` | działa (`input/runtime.js`) |
| **`adsMode`, `adsSens`, `crouchMode`** | **czekają na ds-gunfeel**: ADS (`DS.input.adsActive()`, `DS.player.fovMul`, `adsFov`/`adsTime` z danych broni) i kucanie (`isDown('crouch')`, `moveMult*`) nie są jeszcze zaimplementowane; opcje zapisują się, ale nic nie zmieniają (`adsSens` obniża czułość tylko, gdy trzymasz akcję `ads`, domyślnie ×1) |
| `xh*, uiScale, contrast, motion, dmgInd, keys` | działają (interfejs) |

## Konwencje

- Jednostki: **metry**, sekundy, radiany. +Y w górę, gracz patrzy w −Z przy yaw=0. Oczy na 1,62 m.
- Modele broni wylotem w **−Z**; modele wrogów: przód w −Z (obrót `atan2(-dx,-dz)`); auta: przód w −Z.
- Styl: `toon(color)` z `render/materials.js` + kontur `hull(mesh, t)` (bryły obłe) albo `edges(mesh)` (kanciaste).
- Nie zmieniaj wyglądu ani balansu bez zadania. Bez nowych zależności.

## Wydajność

- **Brak alokacji w pętli**: trzymaj tymczasowe `Vector3` na poziomie modułu; nie twórz geometrii/materiałów per klatkę.
  (Dziedzictwo: `addFloater`, smugi i `G.enemies.filter` alokują; nie powielaj tego w nowym kodzie.)
- **Instancing** (`THREE.InstancedMesh`) dla powtarzalnych rekwizytów (latarnie, ławki, okna, skrzynie): `DS.props.instance`.
- **Scalanie** statycznej geometrii o tym samym materiale (`BufferGeometryUtils.mergeBufferGeometries`
  trzeba wkleić lokalnie, r128 z CDN go nie ma w `three.min.js`). Dziel materiały między obiektami; współdzielone oznaczaj `userData.shared=true`
  (`disposeObject` i `buildGun` ich nie zwalniają).
- Scalanie jest już zrobione: `render/merge.js` (własny merger), `world/batch.js` (świat per kafelek, jeden hull i jedne
  linie krawędzi na kafelek), wróg `gangster` = 4 siatki + 3 kontury (jeden materiał na wroga, kolory w wierzchołkach),
  żarówki kasyna = `InstancedMesh` (`world.bulbs`, kolor per instancja). `renderer.info.render.calls` NIE liczy przebiegu cieni
  (reset po `shadowMap.render`); realny koszt = `info.autoReset=false; info.reset(); render()` (wtedy calls = cienie + główny).
- **Budżet**: ≤ 400 draw calli na klatkę na poziom (kontur `edges`/`hull` to osobny draw call!), ≤ 300 tys. trójkątów.
  Sprawdzaj: `DS.render.renderer.info.render.calls` / `.triangles` w konsoli.
- **Brak wycieków**: zmiana broni (`buildGun`), cykl gra->menu (`clearRun`) i przeładowanie poziomu (`clearLevel`) nie zwiększają
  `renderer.info.memory.geometries` ani `scene.children.length` (testy: `tests/integration.js`, `tests/perf.js`).
- Raycast tylko po `world.meshes` + siatkach wrogów; nie dopisuj tam drobnicy dekoracyjnej.
- Cienie: jedno światło kierunkowe; małe rekwizyty `castShadow=false`.

## Znane fakty

- Neony: migotanie to przygaszenie koloru (`animateWorld`), nigdy `visible=false`. Szyldy mają `polygonOffset`.
- Szyldy rysują tekst fontem Bangers na canvasie; `main.js` czeka na font (max 1,5 s) przed `loadLevel`.
- `hurt(d)` (`game/combat.js`) najpierw przepuszcza obrażenia przez `absorbDamage` (pancerz, `pickups/armor.js`), dopiero potem odejmuje HP.
