# Prośby od ds-gunfeel (poza js/gunfeel i js/audio/gunsfx.js)

Gunfeel działa dziś bez zmian w cudzych plikach: nadpisuje kamerę i viewmodel na zdarzeniu `update` (po `updateCamera`/`updateViewmodel`)
i owija kilka funkcji `DS.player` w czasie działania. Poniższe zmiany zastąpiłyby te obejścia jawnymi hookami.

## ds-architect (weapons/fire.js, player/player.js, weapons/viewmodel.js, game/loop.js)
1. **Rozrzut w ADS (balans).** `fire.js`: `const s=W.spread*moving*air*(DS.player.spreadMul?DS.player.spreadMul():1)`. Gunfeel już wystawia
   `DS.player.spreadMul()`: w pełnym ADS kąt rozrzutu = `W.spread * (W.adsSpread || 0,5)`, niezależnie od zoomu. Dziś rozrzut w ADS
   maleje tylko „przypadkiem”, bo fire.js losuje go w NDC, a węższy FOV zmniejsza kąt (ADS 0,8 -> ok. 0,75 kąta z biodra, luneta SVD ok. 0,43).
2. **Punkty trafień w `shot`.** Dodać do payloadu `hits:[{point, normal(świat), object, enemy}]` (to, co fire.js już liczy). Gunfeel robi dziś
   własny raycast (1 promień, śrut do 3) do śladów, iskier i smug, więc przy śrucie ślady nie pokrywają się dokładnie z `puff()`.
3. **Trwały podrzut.** `fire.js` woła `DS.player.addRecoil(W.pitchKick,0)` bez `recoilMul()`. Gunfeel owija `addRecoil` (mnoży przez
   `recoilMul()` i rozkłada podrzut na ~3 klatki, suma bez zmian). Lepiej: fire.js woła `addRecoil(W.pitchKick*DS.player.recoilMul(),0)`,
   a owijka gunfeel zostaje tylko do wygładzenia.
4. **Prędkość w ADS.** Gunfeel owija `DS.player.speedMul()` (ADS: `moveMultAds/moveMult` z danych). Prośba: w `player.js` jawna lista
   mnożników (np. `DS.player.speedMods.push(fn)`), żeby owijki adrenaliny/perków/ADS się nie nakładały.
5. **Kamera i viewmodel.** `updateCamera` losuje wstrząs co klatkę (`rand(-shk,shk)`), a `updateViewmodel` składa bob/odrzut/przeładowanie;
   gunfeel nadpisuje oba wyniki w `update`. Prośba: flaga `DS.player.feelOwnsView=true`, przy której te funkcje pomijają swoje warstwy
   (bez zmiany zachowania, gdy gunfeel nie jest załadowany). Nie trzeba wtedy liczyć tego dwa razy.
6. **Hit-stop.** Gunfeel owija `clock.getDelta()` z `game/loop.js` (≤ 40 ms zwraca 0). Prośba: oficjalny `DS.time.freeze(ms)` w pętli.
7. **Znane, niezależne od gunfeel:** test `level.reloadStable` bywa niestabilny: po pierwszym runie pierwsze 5 przeładowań poziomu w menu
   dokłada ~13 geometrii (to samo na kopii bez gunfeel; potem stabilnie). Zależy od kolejności klatek, nie od zmian gunfeel.

## ds-input-menus (ui/, input/)
1. **Opcja hit-stopu w „Dostępność”:** przełącznik `opt.hitStop` (1/0, domyślnie 1; gunfeel sam dopisuje domyślną wartość). Dodatkowo
   tryb „Bezpieczna” (`opt.fx=0`) wyłącza hit-stop, światło błysku i trzęsienie kamery.
2. **Celownik w ADS:** gunfeel ustawia `#xhair.style.opacity` (0 w pełnym ADS). Jeśli HUD kiedyś sam ustawi `opacity`, prośba o czytanie
   `DS.player.adsProgress()` (0..1) zamiast tego.
3. **Znacznik trafienia:** zwykłe trafienie i headshot pokazuje celownik HUD (`.xh.hit`, czasy 0,14/0,22 s w hud.js); gunfeel dokłada
   znacznik zabicia (X, czerwony przy headshocie) i pierścień headshota na własnej nakładce `#gfOverlay`, a stary znacznik z `comicfx`
   (`G.hitT`) tłumi. Do rozważenia: czasy znacznika HUD z `DS.gunfeel.T.GLOBAL.hit`.
4. **Kucanie:** akcja `crouch` i `crouchMode` nadal nic nie robią (ruch jest w player.js, nie w gunfeel).

## ds-weapon-data (weapons/data)
1. **`adsSpread`** (mnożnik rozrzutu w pełnym ADS) per broń; dziś gunfeel bierze domyślne 0,5 (`GLOBAL.ads.spread`).
2. **Mosin:** `adsFov 0,43` zakłada lunetę 3,5x, ale model (ds-weapon-modeler) ma przyrządy mechaniczne. Albo luneta w modelu, albo
   `adsFov 0,8`. Gunfeel tego nie zmienia, bo FOV w ADS wpływa na rozrzut (balans, patrz architect #1).

## ds-weapon-modeler (weapons/models)
1. Gunfeel animuje części: `slide|bolt`, `magazine` (Python: `cylinderSwing`), `trigger`, `hammer`, `cylinder`, `pump`, `boltHandle`,
   `cover`, `belt`, `beltBox`, `ejectionPort`, `scope` (`userData.setAds`). Proszę nie zmieniać tych nazw ani punktów obrotu bez znaku tutaj.
2. Legacy `pistol/shotgun/rifle` nie mają `sightAnchor`: punkt oka jest wpisany ręcznie w `gunfeel/tuning.js` (`WEAPON.*.anchor`).

## Status po spinaniu (integrator, po commicie 270d8a9) i co gunfeel ma przepiąć
Zrobione po stronie architekta: #1 (`spreadMul` w fire.js, domyślny hook w player.js, `adsSpread` w danych), #2 (`hits` w `shot`), #6 (`DS.time.freeze(ms)` w loop.js),
#5 (flaga `DS.player.feelOwnsView`, domyślnie false), opcja `opt.hitStop` w Dostępności, `adsSpread` per broń, Mosin `adsFov` .65. #3 i #4 celowo bez zmian
(owijki działają stabilnie i są opisane w ARCHITECTURE.md; podwójne mnożenie `recoilMul` byłoby błędem).
Do zrobienia w `js/gunfeel/` (integrator tam nie edytuje):
1. `feel.js`: ustawić `DS.player.feelOwnsView=true` po załadowaniu (wtedy base camera/viewmodel nie liczą się dwa razy). Uwaga: przy fladze `updateCamera` nie aktualizuje też FOV,
   ale gunfeel i tak robi to sam (feel.js:163).
2. `feel.js`/`fx.js`: zamiast własnego raycastu do śladów/iskier czytać `DS.bus.on('shot', e => e.hits)` (punkt + normalna świata, wszystkie śruty).
3. `overlay.js`: hit-stop przez `DS.time.freeze(ms)` zamiast owijki `clock.getDelta` (zostawić owijkę nie szkodzi).
4. `feel.js:54` `spreadMul`: po wprowadzeniu `adsSpread` w danych gunfeel dostaje wartości z `W.adsSpread` (już czyta). Kompensacja FOV (tan f0/tan f1) jest nadal potrzebna, bo fire.js losuje w NDC.