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

## Poziom 4 „Dworzec i bocznica” (`dworzec.js`, id `dworzec`): stan i prośby

Arena 78 m (3,45x Remiza), zmierzch, stacja czołowa: budynek dworca z poczekalnią i kasą (kolider hali przejezdny), 4 tory z perone-wyspami, składy jako
labirynt (przerwy 2-9 m, przejścia przez perony G1/G2), plac manewrowy z nastawnią (arena bossa: `waves.bossArena` x 0, z -30, na torze 5 stoi SM42 jako osłona),
bocznica T7 z dwoma magazynami z rampami, przejazd z zaporami, brama automatyczna (`slidingDoor auto`), wiadukt (3 łuki = 3 aleje E-W), 2 tunele (ślepe, iluzja),
zejście do przejścia podziemnego (sekret). Znajdźki 13 (`dw-*`), sekrety: zejście służbowe (E na końcu zejścia), przekaźkownia za nastawnią, zaplecze magazynu.
Wygrana: zabicie dowolnego bossa z puli tabeli (`e.boss`; dziś Jednooki, bo `boss_dyzurny` nie istnieje, po jego dodaniu wchodzi sam); `levelsDone.dworzec`.
`tests/dworzec.js`: 81 asercji (BFS osiągalności z otwartymi sekretami, kieszenie, osłony <=10 m w 97% komórek, 30 wrogów: 200-273 calli / 181-219 tys. tri).

**Zmiana w `common.js`:** `buildNav(level,{assign:true})` naprawia błąd z Remizy/Blokowiska/Kasyna: linia komentarza w `buildNav` połknęła przypisanie `level.nav=...`
(literalne `\n` w komentarzu), więc te trzy poziomy NIE mają `level.nav.cover` (AI dostaje tylko siatkę). Nowy poziom używa `assign:true`; stare zostawiłem bez zmian,
żeby nie ruszać ich testów. Prośba: po stronie ds-enemy-designer sprawdzić zachowanie `cover/flee` z listą osłon i włączyć `assign:true` także w starszych poziomach.

**KOLIZJA ID (ds-world-modeler, pilne):** `props/road.js` rejestruje `wiadukt` (wiadukt drogowy 39 m) i nadpisuje `wiadukt` z `rail.js` (segment kolejowy 7,6 x 12 m). Poziom Dworzec
buduje więc swój wiadukt lokalnie (`railViaduct` w `dworzec.js`). Prośba: zmienić id jednego z nich (np. `wiaduktDrogowy`); żaden inny id z `rail*.js` nie koliduje z `road.js`/`village.js`.

**Brakujące rekwizyty (ds-world-modeler):**
1. **Peron niski/chodliwy** (0,3-0,5 m) albo peron z rampą: wysoki `peron` (1,13 m) jest ścianą, więc perony są tu tylko osłonami przeciętymi przerwami (silnik: płaska podłoga).
2. Wagon z otwartymi drzwiami/wejściem (poczekalnia w składzie, wagon-bar), wagon pocztowy, platforma kolejowa z kontenerem, wagon-cysterna z drabinką jako chodliwy pomost.
3. Kolejowa wieża ciśnień, komin i dźwig/suwnica bramowa jako prop (dziś `addPart` w poziomie), semafor tarczowy, rozjazd z ręczną dźwignią jako interaktywny (rozjazd `torRozjazd` ma uproszczoną geometrię i nie łączy torów).
4. Kontener morski (20 stóp) i paleta z workami jako osłony; tablica odjazdów LED nad halą; automat biletowy; kasownik; ławka peronowa z neonem; budka telefoniczna.
5. Tabor ruchomy (animacja przejazdu składu po torze 2 w trakcie fali), animowana zapora kolejowa (opuszczana/podnoszona) i mrugające światła przejazdowe jako stan, nie tylko decal.
6. Wiadukt ze schodami/rampą na górę (wymaga `world.groundY`, patrz punkt 4 wyżej): dziś górny tor jest tylko widokiem z alei (kozioł oporowy jest ustawiony na wysokości pomostu, `collide:false`).

**Dla ds-enemy-designer:** boss `boss_dyzurny` (szkic w `bosses.js`): arena = plac przed nastawnią (x 0, z -30, hw 11, hd 13) z torem 5 pośrodku (telegrafowane pasy na torach pasują do osi Z);
w arenie są 2 beczki wybuchowe, 6 skrzynek SRK (pełna osłona 1,7 m), lokomotywa SM42 jako duża przeszkoda.
