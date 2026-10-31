# Prośby od ds-level-designer (poza js/world/levels/)

Poziom 2 „Blokowisko” działa bez tych zmian; poniżej to, co poprawiłoby integrację.

## Brakujące rekwizyty / problemy w js/world/props (ds-world-modeler)
1. **Atlas decali pełny** (2048x1024 w `props/lib.js`): przy poziomie z blokami, autami i garażami konsola daje `props atlas pełny: car:*, estate:garaz*, ...`
   i decale (tablice, numery garaży, rdza) wpadają na pierwszy prostokąt. Prośba: atlas 4096x2048 albo drugi atlas.
2. `neonSzyld`: `place({y})` przekazuje `y` zarówno jako przesunięcie, jak i `o.y` środka szyldu (wysokość liczy się podwójnie).
3. Brak: winda/klatka z wejściem (blok ma tylko dekoracyjne drzwi), fontanna/rzeźba na plac, stół do ping-ponga, ognisko, kontener na gruz,
   pawilon handlowy jako prop (poziom stawia go z `facade()`), betonowa płyta 3x2,2 m jako osłona (poziom robi `addBox`).

## ds-architect (player/game)
4. **Wysokości terenu**: gracz ma płaską podłogę y=0 i kolidery 2D, więc dachy garaży, schody i piwnice nie są chodliwe. Potrzebne `world.groundY(x,z)`
   (płyty z wysokością w `world.colliders`, np. `{..., top:h, walk:true}`) + rampy; wtedy poziom doda dachy i prawdziwe piwnice (dziś: 3 ukryte pokoje).
5. **Spawn wg stref**: `enemies/manager.js` losuje pierścień 22-36 m od środka areny. `level.spawnZones` (id, x, z, r, w, from, boss) i
   `level.waves.bossArena` są zdefiniowane, nikt ich nie czyta. Prośba do manager/waves: losować strefę z wagą dla fali (`spawnEnemy(type,{at})` już istnieje).
6. **Ukończenie poziomu**: poziom sam nagradza zabicie `level.win.boss` (zdarzenie `levelComplete {level, wave}`, `save.levelsDone[id]`, `G.levelWon`).
   Prośba: HUD/menu mogą to pokazać (ekran „Poziom ukończony”, znaczek przy poziomie).
7. **Zapis znajdziek poziomu**: `save.lvFound = {id:true}` (kasety, klucze, plakaty; łańcuchy odnawiają się co run). Prośba: dopisać `lvFound:{}` i `levelsDone:{}` do `DEF_SAVE`
   oraz ekran kolekcji (`ui/extras.js` używa `save.found` typ->liczba, więc nie mieszam). Zdarzenie `collectible {id,type,name,level,found,total}`.
8. `level.track` ('B') jest stosowany na `levelStart` tylko gdy `opt.track==='A'` (domyślny); ewentualnie dodać do opcji „Utwór: wg poziomu”.

## ds-enemy-designer
9. `enemies/nav.js`, tryb grafu (`level.nav.points`): gdy komórka celu jest zablokowana (gracz przy ścianie; siatka R0=.6 > promień gracza .45) `graphPath` zwraca
   prostą linię i wróg kleje się do ściany; tryb siatki używa `nearestFree`. Poziom dlatego podaje tylko `nav.cover` (graf: `buildNav(level,{graph:true})`).
10. Wrogowie nie wchodzą do ukrytych pokoi (drzwi w siatce są ścianą), co jest zamierzone.

## Co poziom robi sam (common.js, do reuse w kolejnych poziomach)
`setEnv` (niebo/mgła/światła + cień słońca podąża za graczem, przywracane na `levelUnload`), `mergeIntoZones` (kafelki 16 m -> strefy 56 m, proxy raycastu
zostają kafelkowe; neony o tej samej teksturze w jedną siatkę), `room/slidingDoor` (drzwi E, kolider znika po otwarciu), `placeCollectibles`, `placeBarrels`
(strzał -> wybuch, łańcuch), `healMachines`, `buildNav` (osłony z colliderów).

## Poziom 3 „Kasyno Złoty Bandyta” (`kasyno.js`): stan i prośby

Arena 75 m (150 x 150 = 22 500 m2, 3,2x Remiza), noc, wnętrze pod dachem. Pętla zewnętrzna (parking, aleje, podwórze) + wejścia boczne/tylne bez drzwi.
Znajdźki: 14 (`ks-*`), sekrety: skarbiec (E), chłodnia (E), windy A i B (E: otwarcie; E w kabinie: jazda do drugiej windy = skrót kuchnia <-> magazyn).
Boss: Jednooki (fala 5, parkiet = `waves.bossArena`), DJ (fala 10). Ukończenie: pokonanie Jednookiego. Utwór `C`. `tests/kasyno.js`: 60 asercji.
Zmiana w `common.js`: `buildNav(level,{coverMax,coverMaxH,coverLimit})` (domyślnie bez zmian dla Blokowiska); waypointy liczone tylko przy `graph:true`
(wcześniej O(n^2) przy każdym wczytaniu bez użycia).

**Brakujące rekwizyty (ds-world-modeler):**
1. Drzwi wahadłowe/obrotowe wejścia kasyna (dziś: otwór 8 m z żółtymi słupkami) i szlaban parkingowy; stretch limuzyna (parking) i bramka z taśmą/słupki z liną do lóż VIP.
2. Zasłona/kotara sceny, telebim LED na ścianie hallu, wieszaki szatni, stosy żetonów i sztaby złota jako osobny rekwizyt (dziś: skrzynie `crate` w skarbcu).
3. Stół do bakarata/kości i koło fortuny (poza ruletką), terminal kasy z ekranem, fontanna w foyer.
4. Antresola ze schodami i balustradą (loże nad parkietem): wymaga `world.groundY` (patrz punkt 4 wyżej), dziś tylko wysokie lustra/kolumny jako „piętro”.
5. Windy: `windaDef.place` zwraca `doorL/doorR/doorCol`, ale brak API do animacji; poziom sam przesuwa drzwi (`kasyno.js: placeLift`). Przydałoby się `userData.setOpen(t)`.
6. `kulaDisco`: place() skleja w świat, więc obrót robi `make()` + `scene.add` w poziomie; wersja z flagą `spin` byłaby czystsza.

**Uwagi o budżecie:** 30 wrogów + cały poziom: 215-325 draw calli i 217-290 tys. trójkątów (parking w kadrze = najgorszy przypadek, brak occlusion cullingu
w silniku; 161 automatów x 396 tri i auta ~1100 tri to główni konsumenci). Kolejne wnętrza: rozważyć rekwizyty LOD albo `instance()` z neonami (dziś `instance` pomija neony/decale).
