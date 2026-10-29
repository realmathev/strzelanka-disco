# Disco Strzelnica: lista kontrolna QA (po każdej fazie)

Serwer: `node tests/serve.js [port]` (port 4173), albo `node tests/serve-shots.js [port]` (to samo + zapis zrzutów z canvasu do `tests/shots/`
przez `POST /__shot/<nazwa>.png`), albo `npx -y serve disco-strzelnica`. Wszystkie skrypty ładuje się w konsoli / `javascript_tool` na świeżo
załadowanej stronie: `(0,eval)(await (await fetch('/tests/<plik>.js')).text()).then(r=>JSON.stringify(r,null,1))`.
Dłuższe skrypty uruchom bez `await` na wyniku i odpytuj `window.__x` (limit javascript_tool to 45 s).

## Skrypty
| plik | co robi |
|---|---|
| `smoke.js` | faza 0 + 1: ostrzeżenie, menu, podekrany, neony, fale, kadry, klawisze, rebind, śmierć, restart, zapis, konsola. Ekran level-up omija przez `DS.progression.ui.forceClose()` (pauzuje grę!) |
| `integration.js` | faza 1: kupno 18 broni w sklepie, wybór/strzał/przeładowanie 19 broni, wyciek geometrii, pancerz i pickupy leczenia, prawdziwy level-up z perkiem, wszystkie 33 perki, rebind w UI i w grze, rejestry |
| `perf.js` | FPS (okno widoczne!), draw calle z cieniami, geometrie po 5 falach x 2 cykle |
| `viewport.js` | przepełnienie poziome każdego ekranu i zakładki opcji przy bieżącym viewporcie (resize_window + przeładowanie) |
| `phase1b.js` | po spinaniu fazy 1: trudność w prawdziwym AI (obrażenia wroga w gracza x0,75/1/1,25), pancerz w prawdziwym trafieniu, czułość myszy, `hitVol`=0, tryb „Bezpieczna”, reguły reduced-motion w CSS, 10 cykli gra->menu (plateau geometrii), 10x przełączenie poziomu. Trwa ~60-80 s: uruchom bez `await` i odpytuj `window.__x` |
| `oldsave.js` | zapis ze starego formatu (`smg`, nieznane id broni, brak nowych opcji): krok 1 ustawia localStorage, po przeładowaniu krok 2 sprawdza migrację `smg`->`uzi`, klawisze slotów, brak błędów |
| `perf2.js` | faza 2: FPS i draw calle przy 30 wrogach naraz (fala 65, `maxAlive` 30) na Remizie i Blokowisku, preset Wysoka/Niska. Ustaw `window.__cfg={levels,presets}`, wynik w `window.__x` (gotowe, gdy `__x.done`). Ukryty panel: rAF przycina sie do ~1 klatki/s (stalle >250 ms), skrypt raportuje FPS z i bez stalli |
| `blokowisko.js` | poziom 2: wybor z menu, BFS osiagalnosci, 13 znajdziek, 3 sekrety (E), beczki, boss fali 5 + pasek HP, chodzenie klawiszami, wycieki remiza<->blokowisko, ostrzezenie atlasu. ~40 s |
| `gunfeel.js` | ADS (PPM, hold/toggle), seria, odrzut, R, klawisze 1-6, kolko, hit-stop (hitStop 1/0, fx=0), tryb Bezpieczna. Zdarzenia wejscia prawdziwe, klatki reczne (dziala w ukrytym panelu) |
| `harness.js` | wspólny pomocnik `window.QA` (ręczne klatki, celowanie, start gry, koszt klatki) |

## Wymagają widocznego okna (rAF działa)
- [OKNO WIDOCZNE] FPS na „Wysokiej” i „Niskiej”: spokojna scena i 8 wrogów + boss (`perf.js`). Próg >= 55 FPS na Wysokiej. Jeśli panel przeglądarki
  jest ukryty, rAF stoi (0 klatek) i FPS nie wolno podawać; pokaż panel (`show_pane preview`) i zrób zrzut, żeby okno było aktywne.
- [OKNO WIDOCZNE] Pointer lock: klik „Graj” blokuje kursor; ruch myszą obraca widok; Esc = pauza; „Wznów” blokuje ponownie; alt-tab = pauza.
- [OKNO WIDOCZNE] Kadry komiksowe przy headshocie: 3 kadry, znikają po ~2,4 s, nie częściej niż co 5 s; opcja „Kadry” wyłączona = brak.
- [RĘCZNIE] Dźwięk: strzał, trafienie, headshot, przeładowanie, muzyka w 3 utworach, suwaki głośności, brak trzasków. Nowe bronie używają starych nazw sfx.
- [RĘCZNIE] `prefers-reduced-motion: reduce` (DevTools > Rendering; wbudowana przeglądarka tego nie emuluje): domyślne `opt.fx` = 0, brak animacji `.cpanel`, `.lv-*`.
- [RĘCZNIE] Ocena wizualna modeli: `tools/weapon-viewer.html?w=<id>&view=side|iso|ads|hip`, `tools/prop-viewer.html?cat=ulica|auta|zieleń|rynek|neony`.

## Faza 1: lista do sprawdzenia przy każdym przeglądzie
- 18 broni w rejestrze (3 stare + 15 nowych; legacy `smg` = alias do `uzi`); każda ma widoczny viewmodel (`weapon.allHaveViewmodel`); klawisze 1-6 = sloty (`input.slotKeys1to6`), sklep i ekwipunek podają klawisz slotu.
- `hurt()` używa pancerza (`absorbDamage`), `killEnemy` nie losuje już apteczki obok `pickups/drops.js`, adrenalina zmienia prędkość i odrzut.
- Opcje z menu: `hitVol`, `dmgNum`, `difficulty` (mnożniki HP/obrażeń wrogów), `sprintMode` działają; `adsMode`/`adsSens`/`crouchMode` czekają na ds-gunfeel (ADS i kucanie nie istnieją), patrz ARCHITECTURE.md „Opcje”.
- `DS.input.get('use')` ma `group` i widnieje w Sterowaniu; brak konfliktów (`DS.input.conflicts()`).
- Zmiana broni nie zwiększa `renderer.info.memory.geometries` (buildGun zwalnia stary model); po 2 cyklach gra->menu geometrie nie rosną.
- Neony: 4 szyldy świecą stale (mrugają tylko jasnością), w trybie „Bezpieczna” wcale; rekwizyty `neonSzyld` dodane przez `place()` trafiają do `world.neon`.
- Stary zapis (`discoStrzelnica.save.v1` / `.opt.v1` z fazy 0, także z nieznanym id broni) wczytuje się, nowe opcje dostają domyślne.

## Zakresy
- Viewport 375 (wymaga `<meta name="viewport">`, jest), 768, 1280x720, 1920x1080: brak przewijania poziomego (`viewport.js`), HUD w całości.
- Tryb efektów „Bezpieczna”: `G.flashT` zawsze 0, neony i żarówki bez mrugania.

## Arena wrogow (`tools/enemy-test.html`)
Samotest `ARENA.selfTest()` WYMAGA adresu z `?manual` (`/tools/enemy-test.html?manual`): bez tego petla gry chodzi sama na rAF, `A.frame()` tylko renderuje i ~85 testow (ai.*.widziPrzed, upadek, wyciek.*.scena...) pada falszywie (to NIE artefakt SwiftShadera). Z `?manual`: 252 PASS, 18 info, 0 FAIL (GPU i tak niepotrzebne, ~3 s).
