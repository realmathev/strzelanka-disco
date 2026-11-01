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

## Poziom 5 „Wiejska dyskoteka w lesie” (`dyskoteka.js`, id `dyskoteka`): stan i prośby

Arena 78 m (3,45x Remiza), noc z księżycem, gwiazdami i mgiełką (sky/Points/halo podążają za kamerą). Centrum: sala wiejska zbudowana lokalnie (ściany z wejściem i wyjściem awaryjnym `slidingDoor auto`,
parkiet+kula, scena DJ, bar z półkami i stołkami, loże, kolumny-osłony, wieża OSP, billboard DYSKOTEKA). Parking przed salą = arena bossa (`bossArena` x 0, z 24): traktory, Maluchy, namiot z piwem, przyczepa z sianem, bele, beczki.
Zagroda (dom, obora, stodoła z wnętrzem, brama `auto`), skład maszyn (Bizon, Ursusy), labirynt z kukurydzy 7x8 komórek (DFS + pętle, 3 wejścia, polana z kombajnem; instancing `poleZboza`), pole pszenicy, polana z ogniskiem,
leśniczówka, ambona z pasieką, las: ok. 650 tanich świerków w `InstancedMesh` dzielonych na komórki 26 m z własnym frustum cullingiem (`cullForest` na `update`), pnie trafialne raycastem, plus drzewa `drzewo` jako osłony przy drogach.
Znajdźki 13 (`dk-*`), sekrety (E): zaplecze DJ-a, bimbrownia w stodole, leśniczówka. Wygrana: zabicie dowolnego bossa z puli (dziś `boss_soltys`), `levelsDone.dyskoteka`.
`tests/dyskoteka.js`: 86 asercji; 30 wrogów: 222-317 draw calli, 187-264 tys. tri.

**Techniczne:** `ExtrudeGeometry` jest nieindeksowana i psuje `flushBatches` (`mergeGeometries: mieszane indeksowanie`), więc przed `addPart` trzeba ją zaindeksować (zrobione lokalnie w `gableRoof`).
Instancje trafialne raycastem trzeba samemu dopisać do `world.meshes` (`inst()` w poziomie); `instance()` tego nie robi, więc bez tego kule i wzrok przenikają przez płoty/kukurydzę.

**Brakujące rekwizyty (ds-world-modeler):** 1. sala wiejska z wnętrzem (dziś `salaWiejska` to zamknięta bryła; poziom buduje własną salę, prop stoi tylko jako remiza OSP przy szosie); 2. stodoła/obora z otwartym wnętrzem i drabiną na stryszek;
3. prosty tani las (`swierkLowPoly` do instancingu) i krzewy jako ściana; 4. stoły biesiadne z ławami, grill, scena/podest dla kapeli, girlandy (dziś `bulbs` w poziomie); 5. kukurydza jako rośliny (dziś bloki rzędów), snop/kopa jako osłona;
6. Maluch/Polonez z drzwiami otwartymi (kryjówka), kombajn z wejściem do kabiny; 7. wąskotorówka lub rampa/schody na dach sali (silnik ma płaską podłogę, więc "piętra" są tylko wizualne).


## Poziom 6 „Stacja paliw i autostrada” (`stacja.js`, id `stacja`, ostatni w `index.js`): stan i prośby

Arena 78 m (3,45x Remiza), świt/późny wieczór: niebo to kopuła z gradientem na kolorach wierzchołków (pomarańcz, róż, fiolet) ze słońcem i zorzą (podąża za kamerą, jak księżyc w dyskotece), mgła w kolorze horyzontu.
Centrum: stacja PALIWEX (sklep z wnętrzem, wiata, 4 dystrybutory w instancingu, auta przy pompach, kompresor, donice, opony, beczki) = plac bossa (`bossArena` x 0, z 12). Wschód: autostrada (dwie jezdnie `jezdnia:ekspresowa`,
bariery `barieraEnergo`, ekrany akustyczne, latarnie, bramownice, wiadukt `wiaduktDrogowy` na z=-40, wraki i TIR-y jako osłony; przerwy serwisowe w barierach). MOP: wiaty, toi-toi, Bar u Zdzicha, billboardy.
Parking TIR = labirynt 7 naczep (rzędy równoległe plus rząd poprzeczny od południa, wejścia od północy i z zachodu). Zachód: warsztat z podwórkiem, myjnia, złomowisko. Północ: pole/nieużytek z drogą polną, bele, stogi, przyczepy;
skład paliw (fence plus brama `slidingDoor auto`, zbiorniki, beczki). Znajdźki 13 (`st-*`), sekrety (E): zaplecze sklepu, kanał w warsztacie, bunkier na polu. 14 beczek wybuchowych (5 grup), 7 automatów leczących.
Wygrana: zabicie dowolnego bossa z puli (dziś `boss_szef_stacji` na fali 5), `levelsDone.stacja`; ekran `scrLevelDone` jest bez „Dalej” (`nextLevel('stacja')===null`, przycisk ukryty), zostają „Graj dalej” i „Menu”.
`tests/stacja.js`: ok. 100 asercji; 30 wrogów: 200-285 draw calli, 150-245 tys. tri (najgorszy widok: start na dojeździe, bo widać całą stację, parking i autostradę).

**Techniczne:** `scatter()` w poziomie rozsiewa osłony (drzewa, bele, stogi, przyczepy) z odstępem i testem kolizji po postawieniu zabudowy; bariery, ekrany i latarnie jako `inst(..., {noCast:true})` oszczędzają przebieg cieni
(ok. 48 tys. tri). `instance()` ustawia `frustumCulled=false`, więc długie linie barier (100+ sztuk) liczą się do budżetu trójkątów także poza kadrem; przydałby się culling grupowy w `props.instance`.
**Uwaga o `dyskoteka.js`:** plik ma podwójnie zakodowane polskie znaki (UTF-8 odczytane jako Windows-1250 i zapisane ponownie, ok. 50 linii z „Ä™”, „Ĺ‚”), więc nazwy znajdziek i napisy tego poziomu wyświetlają się z krzaczkami. Do naprawy osobno (poza zakresem poziomu 6).

**Brakujące rekwizyty (ds-world-modeler):** 1. zbiornik paliwa (poziomy walec, zbiornik podziemny z włazem) i autocysterna drogowa (dziś `tank()` w poziomie jako walec); 2. kanał/dół rewizyjny w warsztacie i rolowana brama otwierana (dziś `room()` jako „kanał”);
3. sklep stacji z zapleczem i drzwiami (dziś zaplecze budowane `room()` za budynkiem); 4. bariera betonowa New Jersey, znaki drogowe (A/S, objazd), tablica zmiennej treści (VMS), słupki prowadzące; 5. kamper, laweta, motocykl, Maluch z otwartymi drzwiami jako kryjówka;
6. automat do kawy i grill z hot-dogami do wnętrza sklepu, regały w wersji „zdemolowanej”; 7. wiadukt z zejściem/rampą chodliwą (dziś nasypy to ściany: silnik ma płaską podłogę, więc górna jezdnia jest tylko widokiem);
8. prawdziwe źródło światła pod wiatą (dziś tylko emisja `MeshBasic`); 9. kładka dla pieszych nad autostradą, wiata autobusowa na zatoczce.
