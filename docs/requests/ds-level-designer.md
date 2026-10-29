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
