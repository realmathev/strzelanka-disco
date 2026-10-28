# Strojenie feelingu broni (ds-gunfeel)

Wszystkie liczby są w `tuning.js`; tu są wartości początkowe i powody. Zmiana `tuning.js` nie rusza balansu
(obrażenia, kadencja, rozrzut, trwały podrzut `W.pitchKick`, magazynek i czas przeładowania zostają w `js/weapons/data`).
Strojenie w locie: `DS.gunfeel.T.CLASS.rifle.kick.z=.05; DS.gunfeel.invalidate()` w konsoli, potem strzał.

## Granica feel / balans

| warstwa | skąd liczby | wpływa na celność? |
|---|---|---|
| trwały podrzut (część odrzutu, która zostaje) | `W.pitchKick` (fire.js) x `recoilMul()` | tak, balans; gunfeel tylko rozkłada go na ok. 3 klatki (`recoil.applyRate` 42/s, suma bez zmian) |
| aim punch (część, która wraca) | amplituda `W.recoil.pitch/yaw`, powrót `W.recoil.recovery` (dane) x `cam.punch` (=1) | tak, ale liczby są z danych; `cam.punch` zostaje 1 |
| oddech w ADS | `breath` / `breathScope` per broń | minimalnie (0,001-0,0035 rad) |
| kopniak modelu, kosmetyczny podrzut kamery, trzęsienie, bob, sway | tylko `tuning.js` | nie (viewmodel), trzęsienie kamery tak samo jak dawniej `G.shake` |
| rozrzut w ADS | `W.adsSpread` albo `GLOBAL.ads.spread` 0,5 przez `DS.player.spreadMul()` | czeka na fire.js (docs/requests/ds-gunfeel.md #1) |
| prędkość w ADS | `W.moveMultAds / W.moveMult` z danych | tak, dane; bieg bez ADS bez zmian |

## Odrzut (największy wpływ na odczucie)

Trzy warstwy, wszystkie się sumują (kolejne strzały dodają impuls, nic się nie restartuje):
1. **Sprężyna tłumiona** viewmodelu (`kick.freq`, `kick.damp`, amplitudy `z/y/rx/ry/rz`): impuls, przeregulowanie, powrót. Niższe `freq`
   = cięższa broń; `damp` < 0,5 = wyraźne odbicie. Impuls jest przeliczany tak, by szczyt wychylenia = podana amplituda.
2. **Krzywa** (`curveZ`, `curveRx`, `attack`, `decay`): charakterystyczny kopniak, atak ease-out w 12-20 ms, powrót ease-out.
3. **Kamera**: aim punch z danych (sprężyna 13 Hz, ζ 0,55 goni cel, który gaśnie z `recovery`) + kosmetyczny `cam.kick`.

Wzorce: 3-5 na klasę (`patterns`: p = podrzut, y = bok, r = przechył, z = cofnięcie), losowany bez powtórzenia pod rząd, ±16% (`recoil.jitter`).
Broń automatyczna dostaje dryf boczny w serii (`kick.drift`, sinus po numerze strzału).

| klasa | z [m] | rx [rad] | freq/damp | krzywa z/rx, decay | uzasadnienie |
|---|---|---|---|---|---|
| pistolety | 0,042 | 0,17 | 9 / 0,42 | 0,028 / 0,13, 0,16 s | duży obrót nadgarstka, krótko; Deagle x1,5-1,8 (.50 AE), Python 0,24 rad |
| PM | 0,026 | 0,05 | 12 / 0,5 | 0,018 / 0,03, 0,075 s | 10 strz./s: powrót musi zdążyć przed kolejnym strzałem (decay < rate) |
| strzelby | 0,085 | 0,30 | 6,5 / 0,38 | 0,06 / 0,24, 0,30 s | jeden mocny, powolny kopniak; najmocniejsze przeregulowanie |
| karabiny | 0,036 | 0,07 | 10 / 0,48 | 0,024 / 0,045, 0,10 s | AKM +15% (7,62x39 vs 5,56) |
| wyborowe | 0,065 | 0,19 | 7 / 0,40 | 0,05 / 0,16, 0,26 s | 7,62x54R z lekkiej broni; Mosin 0,075/0,24 |
| LKM | 0,042 | 0,06 | 8,5 / 0,45 | 0,028 / 0,05, 0,12 s | masa 9 kg: mniejszy obrót, większy sway (`sway` 1,6) |

W ADS model kopie słabiej (`ads.kickZ` 0,22, `kickRot` 0,16, `kickPos` 0,45): kolba leży pod okiem i większe cofnięcie wjeżdżało
w kamerę (sprawdzone na zrzutach Mossberga i Mosina). Kopniak w ADS niesie głównie kamera.

## ADS

- Wejście: `W.adsTime` z danych (0,14-0,64 s), wyjście 1,25x szybciej; krzywa smootherstep (ease w obie strony, bez skoku przy zmianie kierunku).
- Pozycja: `sightAnchor` modelu trafia w początek kamery, plus `adsOffset` wzdłuż osi celowania (oko dalej od szczerbinki: pistolety
  -0,10 m, strzelby -0,13, karabiny -0,05, LKM -0,06), bo inaczej kolba/komora zasłaniały dół kadru. Linia oko-szczerbinka-muszka się nie zmienia.
- FOV: `W.adsFov` z danych. Broń w ADS nie jest powiększana przez zoom (`ads.vmFovComp` 1): gunRoot jest ściskany w x,y o 1/m,
  m = tan(f0/2)/tan(f/2), co daje na ekranie ten sam obraz broni co przy FOV z opcji (zastępuje osobny FOV viewmodelu bez drugiego renderu).
- Luneta (SVD, `userData.reticle`): od 86% ADS model chowa lunetę i broń, siatka PSO-1 z `reticles.js` rysowana raz do bufora,
  wjeżdża ze skali 1,25 do 1. Render-to-texture nie jest potrzebny (zoom FOV), więc nic nie kosztuje.
- Celownik HUD znika w ADS, sway/bob broni x0,22, oddech kamery 0,0011-0,0015 rad (przyrządy), 0,0032-0,0034 (luneta).

## Ruch

sway od myszy (`sway.look` 0,00055 m na rad/s, max 3 cm, sprężyna 4,2 Hz / masa broni), sway od ruchu bocznego, bob figury ósemki
(x 1 cm, y 0,8 cm, x1,7 w sprincie), poza sprintu (broń opuszczona i skręcona, wyłączana 0,4 s po strzale), skok (broń lekko w dół) i lądowanie
(sprężyna 5,2 Hz, siła z prędkości opadania, max 6 cm broń / 5 cm kamera).

## Animacje (fazy, ułamki W.reload)

- magazynek: przechył 0-0,14, wyjęcie 0,14-0,30, włożenie 0,42-0,60 (+ „dobicie” 0,6), pusty: zamek 0,68 / 0,78 (pistolet: zwolnienie zamka-suwadła 0,74;
  po ostatnim strzale suwadło zostaje w tylnym położeniu), powrót 0,84-1.
- Mossberg: pompka 0,14 s po strzale (tył 0,12 s, łuska, przód), przeładowanie = tyle naboi, ile brakuje, każdy z klikiem; pusty: pompka na końcu.
- Mosin: zamek po strzale (podniesienie, tył + łuska, przód, opuszczenie, ok. 0,7 s z rate 1,2), przeładowanie: zamek, naboje z łódki, zamek.
- PKM: pokrywa, pudło z taśmą w dół i z powrotem, ułożenie taśmy, pokrywa, rączka zamka. Python: bęben na bok, lufa w górę (łuski), 5 klików, bęben.
- Dobycie: 0,32 s (pistolet) do 0,7 s (PKM), ease-out z przeregulowaniem. Nie blokuje strzału (to robi `G.fireT` z fire.js).

## Efekty

Błysk: sprite z viewmodel.js, rozmiar per klasa (0,21-0,42), czas 38-60 ms; światło punktowe 1,8-3,2, zasięg 7,5 m, gaśnie kwadratowo.
Łuski: InstancedMesh (48, jeden draw call), fizyka z odbiciem (0,36) i usypianiem po 3 odbiciach, 2,6 s życia, cichy brzęk przy pierwszym odbiciu.
Dym: 14 sprite'ów; w serii po 6+ strzałach lufa „dymi” po puszczeniu spustu. Smugi: InstancedMesh, 240 m/s, co 1-3 strzał wg klasy.
Iskry/pył/krew: 2 x Points (160 + 200). Dziury: InstancedMesh 64 (pierścień). Powierzchnia z koloru wierzchołka świata: kamień, metal, drewno, ziemia, liście.
Razem +9 draw calli w kadrze z efektami (zmierzone), stała liczba obiektów w scenie (testy wycieków bez zmian).

Hitmarker: zwykłe trafienie = celownik HUD; zabicie = X (0,36 s, czerwony przy headshocie z pierścieniem), headshot = pierścień 0,24 s.
Hit-stop: 34 ms (headshot 40 ms), twardy limit 40 ms; wyłącza `opt.hitStop=0` albo tryb „Bezpieczna”.

## Dźwięk

Warstwy: trzask (szum górnoprzepustowy + szczyt), klik, dudnienie (sinus 150->52 Hz pistolet, 105->32 Hz śrut), korpus, pogłos (wspólny
splot, odpowiedź impulsowa 1,3-1,5 s per poziom), klik mechanizmu. Profile kalibrów: 9x19, 9x18, .50 AE, .357, 9x19 PM, 12/70, 5,56, 7,62x39, 7,62x54R.
Głośność `shotVol` 0,68 dobrana pomiarem offline (szczyt 0,52-0,87 przed kompresorem; dawne dźwięki 0,41-0,80).
Trafienie: opóźnienie 1,1 ms/m, max 35 ms (pętla zwrotna nienaruszona), za 30 m filtr 2,4 kHz; ślad w ścianę 2,9 ms/m, max 90 ms.
Strzały wrogów: dolnoprzepustowy 9 kHz -> 1,1 kHz do 45 m, opóźnienie wg prędkości dźwięku (max 80 ms).

## Intensywność (`opt.fx`)

`INTENSITY`: Bezpieczna = brak światła, brak trzęsienia kamery, brak hit-stopu, mniejszy błysk (0,55), kopniak kamery 0,6, mniej cząstek;
Maksymalna = trzęsienie 1,45, światło 1,3, cząstki 1,5. Sprawdzone: w „Bezpiecznej” rozrzut kąta kamery przy G.shake=1 = 4e-14 (zero), światło 0.

## Pomiary (Chrome headless, ANGLE D3D11, Radeon RX 9070 XT, 1280x720, preset Wysoka)

Seria Uzi / PKM, 8 wrogów: 164 / 166 FPS (limit odświeżania), najgorsza klatka 24 ms (Uzi, tak samo bez gunfeel: 30 ms), 0 klatek > 18 ms przy PKM.
Bez gunfeel ten sam scenariusz: 165 / 166 FPS. Smoke 40/40, integration 92/92 przed i po.

## Do strojenia przez gracza (na słuch i w ręku)

1. `shotVol` i `AUDIO.calibers.*.thump.vol` (dudnienie) – niezweryfikowane na słuch, tylko pomiar poziomów.
2. `kick.freq/damp` strzelb i wyborowych (ile „bujania” po strzale), `ads.kickZ/kickRot` (czy ADS nie jest za sztywny).
3. `hit.stopMs` (34-40) i `killMarker` – odczucie zależne od FPS i myszy.
4. `sway.look` przy niskiej czułości i pointer locku (nieprzetestowane z prawdziwą myszą).
5. `reload.pose` – pozy przeładowania ocenione na zrzutach, nie w ruchu.
