# Balans broni (data/)

Właściciel: ds-weapon-data. Wszystkie wartości w plikach `<id>.js` są wyliczone wg poniższych formuł z pól `real`.
Jednostki: m, kg, m/s, J, s, radiany. Źródła URL-e w `real.src` każdej broni, brak wartości = `null` i wpis w `real.unv`.

## Formuły

**Energia i obrażenia**
- `E = ½·m·v0²` — m = `real.bulletG` [kg], v0 = `real.v0` [m/s]
- `dmgE = min(40, round(1.5·√E))`
- Śrutówki: `dmg = 13` na śrut (kalibracja legacy), `pellets = 9`; `real.v0` nieznane, założenie 400 m/s do odrzutu.

**Kadencja**
- automat: `rate = 60 / rpm` (dolna granica zakresu producenta)
- półautomat z rpm: `rate = max(0.25, 60/rpm)`
- półautomat bez rpm: `0.30` (granica palca, jak legacy pistolet)
- pompka `0.80`, rewolwer DA `0.35`, repetier `1.20` (stałe gameplay)

**Dobór obrażeń do kadencji (TTK)**
- `nmin = max(2, ceil(0.25 / rate))`
- `dmg = min(dmgE, floor(61 / (nmin − 1)))`
- Warunek: gangster HP 62 (fala 0) potrzebuje ≥ nmin trafień, a HP 132 (fala 10) kończy się w ≤ 6 s.
- `TTK = ceil(HP / dmg) · rate` musi mieścić się w [0,25 s; 6 s]. Sprawdzono dla wszystkich 15 broni.

**ADS (celowanie)**
- `adsFov = clamp(0.8 / √Mz, 0.2, 0.8)` — mnożnik `opt.fov`, Mz = powiększenie (przyrządy mechaniczne Mz = 1)
- `adsTime = round(0.10 + 0.06·W + 0.05·log2(Mz), 2)` [s] — W = `real.weight` [kg]

**Rozrzut w ADS** (`adsSpread`, mnożnik `spread` w pełnym ADS; czyta go `DS.player.spreadMul()` z gunfeel, interpolowany po postępie ADS)
- Mnożnik jest liczony na kąt, niezależnie od zoomu (`spreadMul` kompensuje węższy FOV, bo `fire.js` losuje w NDC).
- Wartości klasowe (nie wyliczane, założenie gameplay): pistolety 0,55 (Deagle 0,60, odrzut `.50 AE` psuje celność), PM 0,50 (krótka lufa, ale oparcie o ramię),
  karabiny 0,45 (kolba przy policzku, przyrządy na linii), wyborowe 0,30 (SVD i Mosin: bazowe .003 i tak małe, ADS ma dawać pewne trafienie na dystans),
  strzelby 0,80 (o rozrzucie decyduje dławik, nie celowanie), LKM 0,60 (masa i nieużywany dwójnóg).
- Przed zmianą ADS zmniejszał kąt rozrzutu tylko przez FOV (ok. 0,8 dla przyrządów, 0,4 dla lunety SVD), więc dla pistoletów i PM nowy mnożnik jest wyraźnie mocniejszy.

**Ruch**
- `moveMult = clamp(1 − 0.07·W, 0.60, 1.00)`
- `moveMultAds = max(0.35, 0.6·moveMult)`

**Odrzut** (fizyczny proxy, nie symulacja)
- `Erec = (m·v0)² / (2·W)` [J] — pęd pocisku i masa broni
- `pitch = 0.004·√Erec` [rad], `yaw = 0.25·pitch` [rad, kierunek losowany przez silnik]
- `recovery = clamp(2.5 / rate, 4, 25)` [1/s] — powrót musi zdążyć przed kolejnym strzałem
- Śrutówki: `m·v0` z ładunku 28 g przy 400 m/s (założenie, unverified).

**Klasowe (nie wyliczane)**: `reload` (pistolet 1,1; SMG 1,6; śrut 2,0; karabin 1,8; LKM 4,0; repetier 2,0), `spread` (pistolet .006; SMG .03; śrut .09; karabin .012; wyborowa .003; LKM .02), `kick`, `pitchKick`, `shake`, `burst`.

## Tabela

Slot: 1 pistolet, 2 PM, 3 strzelba, 4 karabin, 5 wyborowa, 6 LKM.

| id | slot | dmg | rate [s] | mag | adsFov | adsTime [s] | moveMult | moveMultAds | recoil pitch / yaw / rec. |
|---|---|---|---|---|---|---|---|---|---|
| glock17 | 1 | 34 | 0,30 | 17 | 0,80 | 0,14 | 0,96 | 0,58 | 0,0103 / 0,0026 / 8,3 |
| p83wanad | 1 | 26 | 0,30 | 8 | 0,80 | 0,14 | 0,95 | 0,57 | 0,0063 / 0,0016 / 8,3 |
| deagle50 | 1 | 40 | 0,30 | 7 | 0,80 | 0,22 | 0,86 | 0,52 | 0,0183 / 0,0046 / 8,3 |
| python357 | 1 | 40 | 0,35 | 6 | 0,80 | 0,17 | 0,92 | 0,55 | 0,0119 / 0,0030 / 7,1 |
| uzi | 2 | 30 | 0,100 | 32 | 0,80 | 0,31 | 0,76 | 0,46 | 0,0048 / 0,0012 / 25 |
| mp5a3 | 2 | 20 | 0,075 | 30 | 0,80 | 0,25 | 0,82 | 0,49 | 0,0057 / 0,0014 / 25 |
| pm63rak | 2 | 27 | 0,092 | 25 | 0,80 | 0,20 | 0,89 | 0,53 | 0,0044 / 0,0011 / 25 |
| mossberg500 | 3 | 13×9 | 0,80 | 6 | 0,80 | 0,29 | 0,78 | 0,47 | 0,0178 / 0,0044 / 4 |
| saiga12 | 3 | 13×9 | 0,30 | 10 | 0,80 | 0,32 | 0,75 | 0,45 | 0,0167 / 0,0042 / 8,3 |
| akm | 4 | 30 | 0,100 | 30 | 0,80 | 0,30 | 0,77 | 0,46 | 0,0089 / 0,0022 / 25 |
| m4a1 | 4 | 30 | 0,086 | 30 | 0,80 | 0,28 | 0,80 | 0,48 | 0,0060 / 0,0015 / 25 |
| beryl96 | 4 | 30 | 0,086 | 30 | 0,80 | 0,30 | 0,77 | 0,46 | 0,0057 / 0,0014 / 25 |
| svd | 5 | 40 | 0,30 | 10 | 0,40 | 0,46 | 0,70 | 0,42 | 0,0109 / 0,0027 / 8,3 |
| mosin9130 | 5 | 40 | 1,20 | 5 | 0,65 | 0,37 | 0,72 | 0,43 | 0,0117 / 0,0029 / 4 |
| pkm | 6 | 30 | 0,100 | 100 | 0,80 | 0,64 | 0,60 | 0,36 | 0,0075 / 0,0019 / 25 |

## Niepewne wartości (`real.unv`)

- Glock 17 i Colt Python: brak v0 w źródłach. Założone 360 i 430 m/s do obliczenia dmg i odrzutu.
- Masy pocisków (`bulletG`): wartości standardowe, nie ze źródeł.
- Mossberg i Saiga: liczba śrutów 9 i v0 śrutu spoza źródeł.
- SVD: powiększenie optyki (4x PSO-1 założone). Mosin: model ma przyrządy mechaniczne, więc Mz ≈ 1,5 (tylko ciaśniejszy kadr w ADS), nie 3,5x z PU.
- Półautomaty bez rpm (Glock, Deagle, SVD, Mosin): kadencja z kolumny „stała gameplay”.
- Uzi zastąpiło legacy `smg` (alias w zapisach, patrz `weapons/slots.js`); legacy ma już tylko pistolet, obrzyn i karabin.
