# Progresja: balans

Wszystkie liczby żyją w `config.js` (XP, krzywa, pity, szanse) i `catalog.js` (perki). Ten plik tylko je opisuje.
Symulacja tempa: model fal z `waves.js` (3+2*fala wrogów, spawn co ~1,2 s, 4 s przerwy), 35% headshotów, combo 1-5.

## Krzywa XP

`need(L) = round(210 * L^1.38)`: XP do przejścia z poziomu L na L+1.

| L | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| need | 210 | 547 | 956 | 1423 | 1936 | 2489 | 3079 | 3702 | 4356 | 5038 |

XP za zabójstwo: `baza(typ) * (headshot 1,5) * (1 + 0,05*min(combo,12)) * (1 + 0,06*(fala-1), max 2,5) * trudność * mods.xpMul`.
Baza: gangster 10, boss 140, nieznany typ `10*sqrt(maxHp/100)` (0,6..3). Trudność: łatwa 0,85, normalna 1, trudna 1,25.
Średnio ok. 13-14 XP na zabójstwo w pierwszych falach.

## Tempo (czas gry do osiągnięcia poziomu, minuty)

| tempo gracza | L2 | L3 | L4 | L5 | L6 | L7 | L8 | L10 |
|---|---|---|---|---|---|---|---|---|
| szybkie (x1,0) | 0,7 | 1,7 | 3,3 | 5,0 | 7,3 | 9,6 | 12,3 | 18,3 |
| typowe (x1,4) | 1,0 | 2,3 | 4,4 | 6,7 | 9,9 | 13,0 | 16,7 | 24,9 |
| wolne (x1,8) | 1,2 | 2,9 | 5,7 | 8,7 | 13,0 | 17,1 | 22,0 | 32,4 |

Cel „pierwszy level-up po ~1 min” spełniony dla typowego tempa (14-16 zabójstw); odstępy rosną z każdym poziomem.

## Jednoręki bandyta i pity

Każdy zakręt kończy się perkiem. Rzadkość: najpierw jackpot 3% (legendarny), inaczej wagi 66 / 27 / 7 (zwykła / rzadka / epicka).
Pity (liczniki w `G.prog.pity`, w runie): po 3 poziomach bez rzadkiej+ następny gwarantuje rzadką+, po 8 bez epickiej+ epicką+ (`legendEvery` domyślnie wyłączone).
Efektywny rozkład (symulacja 200 tys. zakrętów): zwykła 50%, rzadka 34%, epicka 13%, legendarna 3%. Najdłuższa seria zwykłych: 2; najdłuższa seria bez epickiej: 7.
Układ symboli: mieszanka = zwykła (czasem „podpucha” z parą siódemek), trzy takie same ♦ ♥ BAR = rzadka, ★ DISCO = epicka, 7 7 7 = legendarna.
Gdy perk z wylosowanej rzadkości jest wymaksowany, bierzemy najbliższą niższą, potem wyższą; gdy wszystko wymaksowane: premia ZD.
Nowy (jeszcze nieposiadany) perk ma wagę 1,6 względem stackowanego.

## Perki (33): max stacków, wartość za stack

Zwykłe (10): Bimber w lufie (5x, +10% obr.), Oko Sokoła (5x, +20% obr. w głowę), Szybkie Palce Zdzicha (4x, przeładowanie -12%), Dłuższa Kiszka (4x, +20% mag.),
Buty z Biedronki (4x, +6% prędkości), Zupa od Teściowej (5x, +20 HP i leczy), Zeszyt z Notatkami (5x, +12% XP), Kebab po Robocie (5x, +2 HP za zabójstwo),
Magnes na ZD (3x, +50% zasięgu), Kamizelka po Wujku (4x, -7% obrażeń).

Rzadkie (9, 3x): Żubr na Kaca (+1 HP/s), Amunicja z Odzysku (+20% obr.), Tiger o Północy (ogień -10% odstępu), Wampir z Biedronki (5% obr. leczy),
Granat Teściowej (auto-granat co 14 s, -3 s/stack, 70 obr., r 4 m), Unik po Piątym Piwie (+7% uniku), Rykoszet od Ściany (+18%, 1 odbicie),
Echo w Remizie (+10% drugiego strzału), Chciwość Sołtysa (+25% ZD z zabójstw).

Epickie (8): Czysta Wyborowa (2x, +40% obr.), Dubeltówka Dziadka (2x, +25% drugiego strzału), Siostra Halina Czuwa (1x, wskrzeszenie z 50% HP),
Piwnica Pełna Granatów (2x, granat co 7 s, 110 obr., r 5,5 m), Transfuzja z Żubra (2x, 12% obr. leczy), Bilard w Remizie (2x, +35% rykoszetu, 2 odbicia),
Pancerz z Kaloryfera (2x, +50 HP, -15% obrażeń), Turbopolka (1x, +15% prędkości, ogień -12%).

Legendarne (6, 1x): Trzy Siódemki (+75% obr., +50% w głowę), Dyplom Uniwersytetu Disco (XP x2), Lustrzany Bandyta (+35% drugiego strzału i rykoszetu),
Dziewięć Żyć Kota (+2 wskrzeszenia, +30 HP), Disco Apokalipsa (granat co 3,5 s, 170 obr., r 7 m), Magazynek Bez Dna (+60% mag., przeładowanie -40%, ogień -15%).

Zasady siły: zwykłe dają łącznie ok. +50% jednej statystyki po wymaksowaniu, rzadkie ok. +60%, epickie +80% (stack 2x), legendarne jednorazowo +75..100%.
Sufity (`buildMods`): unik 50%, redukcja obrażeń min. x0,2, drugi strzał i rykoszet 95%. Kadencja nie spadnie poniżej x0,4, przeładowanie poniżej 0,25 s.
Granaty skalują się z `mods.dmgMul`. Perki dmgMul/headMul działają przez bonus na zdarzeniu `hit` (przed sprawdzeniem śmierci), więc liczą się do zabójstwa.
