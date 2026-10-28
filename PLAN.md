# Disco Strzelnica — plan produkcyjny

Stan wyjściowy: jeden plik `index.html` (~1200 linii, Three.js r128 z CDN, wszystko proceduralne, zero assetów).
Cel: gra „pod produkcję” — realistyczne bronie z ADS, wiele zróżnicowanych map, więcej wrogów, lepszy feeling broni, progresja przez jednorękiego bandytę, pełne menu z rebindem klawiszy.

## Założenia (daj znać, jeśli któreś jest złe)

1. **Styl:** kształty i proporcje realistyczne (wymiary w metrach, prawdziwe referencje), cieniowanie dalej komiksowe (toon + tusz), bo to tożsamość gry. Jeśli chcesz pełny realizm PBR, to osobna, droższa decyzja.
2. **Brak assetów zewnętrznych:** modele nadal proceduralne w Three.js (Box/Cylinder/Extrude/Lathe/CSG-light). Brak pobierania modeli z internetu.
3. **Architektura:** rozbijamy plik na moduły ES (`js/...`). Działa na JuicyJuicy (statyczny hosting), lokalnie wymaga serwera: `npx -y serve .`. Three.js zostaje globalnym `THREE` z CDN (r128).
4. **Bronie:** prawdziwe nazwy i kalibry, tylko realne modele. Mix światowy + polski (P-83 Wanad, PM-63 RAK, Beryl). Skórki zostają żartobliwe.
5. **Mobile:** poza zakresem (jak teraz, strzelanie = mysz + klawiatura).
6. **Git:** zrób `git init` w katalogu głównym repo (zrobione) przed fazą 1. Pozwala odpalać agentów z `isolation: worktree` i cofać ich błędy.

## Wspólna zasada pracy agentów

- Każdy agent ma **własne katalogi** (tabela niżej) i nie rusza cudzych. Rejestry (`DS.weapons.register(...)`, `DS.enemies.register(...)` itd.) są jedynym punktem styku.
- Każdy katalog domeny ma własny `index.js` importujący jego pliki. `index.html` i `js/main.js` edytuje tylko `ds-architect`.
- Pierwszy krok każdego agenta (poza architektem): przeczytać `ARCHITECTURE.md`.
- Każdy kończy raportem ≤ 15 linii: co zrobione, co nie, jak sprawdzić.

## Agenci

Pliki definicji: `.claude/agents/<nazwa>.md`. Model w frontmatterze to **domyślna rekomendacja**; przy odpalaniu możesz go nadpisać (patrz „Jak odpalać”).

| # | Agent | Model | Faza | Katalogi (własność) | Zależy od |
|---|-------|-------|------|---------------------|-----------|
| 0 | `ds-architect` | opus | 0 | `js/core`, `js/render`, `js/player`, `index.html`, `js/main.js`, `ARCHITECTURE.md` | — |
| 1a | `ds-weapon-data` | haiku | 1 | `js/weapons/data` | 0 |
| 1b | `ds-weapon-modeler` | sonnet | 1 | `js/weapons/models` | 0, 1a |
| 1c | `ds-world-modeler` | sonnet | 1 | `js/world/props` | 0 |
| 1d | `ds-input-menus` | sonnet | 1 | `js/ui`, `js/input`, `css` | 0 |
| 1e | `ds-progression` | sonnet | 1 | `js/progression` | 0 |
| 1f | `ds-healing` | haiku | 1 | `js/pickups` | 0 |
| 2a | `ds-gunfeel` | opus | 2 | `js/gunfeel`, `js/audio/gunsfx.js` | 1a, 1b |
| 2b | `ds-enemy-designer` | sonnet | 2 | `js/enemies` | 0 |
| 2c | `ds-level-designer` | sonnet | 2 | `js/world/levels` | 1c |
| 3a | `ds-qa` | sonnet | po każdej fazie | tylko `tests/` i raporty | wszystko |
| 3b | `ds-publish` | haiku | 3 | `juicy.json`, `thumbnail.png` | 3a |

### Fazy i kolejność

**Faza 0 — fundament (blokuje resztę).** `ds-architect`: czyta cały obecny plik (ja czytałem tylko ~40%: dane, UI, audio, kawałek 3D), dzieli na moduły, definiuje rejestry i zdarzenia, **naprawia błąd znikających neonów**, zostawia grę działającą 1:1 jak dziś. Podejrzany kod: `animateWorld` w `index.html` ukrywa neony przez `visible=false` w losowych klatkach, a znaki mają `fog:false` i leżą daleko; do sprawdzenia też frustum culling i `camera.far`. To hipotezy, nie diagnoza.

**Faza 1 — równolegle** (rozłączne katalogi, można odpalić wszystkie naraz):
- 1a: tabela 15 broni z prawdziwymi danymi.
- 1b: modele broni 3D z przyrządami (muszka/szczerbinka, kolimator, luneta). Odpalasz osobno na klasę: pistolety, pistolety maszynowe, strzelby, karabiny, wyborowe i LKM.
- 1c: biblioteka rekwizytów i budynków (patrz niżej).
- 1d: menu główne, podmenu, opcje, rebind klawiszy.
- 1e: XP + jednoręki bandyta z perkami.
- 1f: leczenie.

**Faza 2:**
- 2a: feeling broni (zbudowany na 1a/1b).
- 2b: nowi wrogowie, AI, bossowie.
- 2c: poziomy (używają rekwizytów z 1c i wrogów z 2b).

**Faza 3:** QA, balans, publikacja nowej wersji na JuicyJuicy.

## Zakres funkcjonalny

### Bronie (15) — tylko prawdziwe modele
- Pistolety: Glock 17 (9×19, 17 nab.), P-83 Wanad (9×18 Makarow, 8), Desert Eagle (.50 AE, 7), Colt Python (.357 Magnum, rewolwer 6)
- PM: Uzi (9×19), MP5A3 (9×19), PM-63 RAK (9×18)
- Strzelby: Mossberg 500 (12/70, pump), Saiga-12 (12/70, półautomat)
- Karabiny: AKM (7,62×39), M4A1 (5,56×45), Beryl wz. 96 (5,56×45)
- Wyborowe: SVD Dragunow (7,62×54R, luneta PSO-1), Mosin wz. 91/30 (7,62×54R, zamek, 5 nab.)
- LKM: PKM (7,62×54R, taśma)

Kalibry i pojemności wyżej są pewne; reszta danych (kadencja, prędkość wylotowa, masa, zasięg skuteczny) agent `ds-weapon-data` ma zweryfikować i podać źródła. Opcjonalnie później: MSBS Grot.

ADS: PPM (przytrzymaj/przełącz — do wyboru w opcjach), przyrządy mechaniczne albo optyka per broń, zmiana FOV, mniejszy rozrzut, wolniejszy ruch, własny celownik/siatka w lunetach.

### Feeling broni (z researchu)
Wnioski z lektur (źródła na dole), do wdrożenia przez `ds-gunfeel`:
- Odrzut jako **sprężyna tłumiona** (impuls → przeregulowanie → powrót) plus **krzywa** na charakterystyczny kopniak; razem dają „ciężar”.
- Pula lekko różnych wzorców odrzutu zamiast jednego powtarzalnego; kolejne strzały mają się sumować, nie restartować animacji.
- Powrót do środka z krzywą ease-out (liniowy wygląda mechanicznie), osobno dla kamery i dla modelu broni.
- Feel kosmetyczny (trzęsienie kamery, kopniak modelu) **oddzielony** od balansu (rozrzut, recovery, aim punch), żeby stroić jedno bez psucia drugiego.
- Szczegóły, które sumują się w feeling: długość hitmarkera, opóźnienie między strzałem a odgłosem trafienia (każde opóźnienie psuje pętlę zwrotną), intensywność wstrząsów.
- Do dodania z wiedzy własnej (research nic nie dał o ADS, błysku i warstwach dźwięku, więc to hipotezy do przetestowania, nie wnioski z lektur): błysk wylotowy + chwilowe światło, wyrzut łusek, smugi pocisków, ślady trafień, sway i bob zależne od ruchu, proceduralna animacja dobycia i przeładowania w fazach, dźwięk strzału w warstwach (trzask + dudnienie + ogon pomieszczenia), hit-stop przy zabiciu.

### Poziomy (6) — większe, zróżnicowane
Każdy ~3–4× większy od obecnej areny, z zaułkami, wieloma poziomami wysokości, skrótami, miejscami do walki z osłonami, sekretami i znajdźkami:
1. **Remiza i rynek** (obecny, rozbudowany): remiza OSP, kościół, kiosk Ruchu, studnia, bazar.
2. **Blokowisko:** płyta-wielka-płyta, trzepaki, garaże, śmietniki, Maluchy i Polonezy, piwnice.
3. **Kasyno „Złoty Bandyta” (wnętrze):** parkiet, bar, kuchnia, zaplecze, sejf, windy.
4. **Dworzec i bocznica:** perony, wagony, nastawnia, tunel, magazyny.
5. **Wiejska dyskoteka w lesie:** sala wiejska, parking z traktorami, pole, stodoła, las.
6. **Stacja paliw i autostrada:** tir, MOP, warsztat, billboardy.

Znajdźki (pomysł): kasety disco polo (kolekcja, odblokowują utwory), złote łańcuchy (waluta), ukryte klucze do skrzynek, plakaty-easter eggi, sekretne pokoje.

### Rekwizyty i budynki (realizm)
Modele z prawdziwymi wymiarami i szczegółami: latarnie, ławki, wiaty, śmietniki, płoty, drzewa, hydranty, samochody (Fiat 126p, Polonez, Passat B5, Żuk), tir, autobus, blok z płyty z balkonami i klatkami, kiosk Ruchu, trzepak, wagony, traktor, stóg siana. Instancing tam, gdzie powtarzalne (wydajność).

### Wrogowie (8+)
Dres (szybki melee), Ochroniarz z tarczą, Bandyta z obrzynem (blisko), Snajper z laserem (daleko), Pijak z butelkami (rzut), Kamikadze z petardami, Medyk-bandyta (leczy innych), Maluchowy kierowca (szarżuje), plus 1 boss na poziom (DJ, Jednooki Bandyta, Szef Ochrony...). AI: patrol, flankowanie, szukanie osłon, ucieczka przy niskim HP.

### Leczenie
Apteczka (jest), bandaże (powolne), adrenalina (instant + sprint), kamizelka (pancerz), jedzenie z mapy (zapiekanka, kebab, Żubr z kaucją), automaty z apteką, regeneracja tarczy po czasie bez obrażeń, leczenie z zabójstw jako perk.

### Progresja
XP za zabójstwa (mnożniki za headshot/combo). Level-up = ekran jednorękiego bandyty: **zawsze** wygrywasz perk. Pity: co N-ty poziom gwarantowany lepszy (rzadki+), jackpot = legendarny. Perki w runie (stackują), ~30 perków w 4 rzadkościach. Zapis meta (waluta, skórki) zostaje jak teraz.

### Menu i opcje
Przebudowane menu główne (animowane tło z 3D, wybór poziomu, tryby), podmenu: Graj / Sklep / Kasyno / Skrzynki / Ekwipunek / Opcje / Osiągnięcia / Kolekcja znajdziek. Opcje: Grafika, Dźwięk, Sterowanie (**przypisanie klawiszy** z wykrywaniem konfliktów i resetem, przytrzymaj/przełącz ADS i sprint, czułość osobno ADS, celownik), Dostępność (błyski, wstrząsy, rozmiar napisów), Gra (trudność, HUD).

## Jak odpalać agentów

W tym czasie sesji agenci wywołujesz po nazwie, np.:

> Uruchom agenta ds-architect.

Model nadpisujesz zdaniem w poleceniu (nadpisuje frontmatter):

> Uruchom ds-weapon-modeler na modelu haiku dla klasy: pistolety.

Zasady oszczędzania tokenów:
- **opus** tylko tam, gdzie błąd kosztuje najwięcej: `ds-architect` (fundament) i `ds-gunfeel` (subtelne strojenie).
- **sonnet** do większości roboty twórczej (modele, poziomy, wrogowie, UI).
- **haiku** do tabel danych, prostych pickupów i publikacji. Jeśli wynik jest słaby, podbij model dla tego jednego agenta zamiast poprawiać ręcznie.
- Agenci modelujący dostają jedną klasę/jeden poziom na uruchomienie, żeby kontekst był mały.
- Po każdej fazie odpal `ds-qa` (sonnet): wyłapuje błędy zanim zbudują się na nich następne.

## Ryzyka

- **Wydajność:** proceduralne modele + 6 dużych map. Wymóg w każdym agencie: instancing, scalanie geometrii statycznej, budżet draw calli, test FPS przez `ds-qa`.
- **Realizm modeli bez assetów:** broń z prymitywów będzie uproszczona. Cel: poprawna sylwetka, proporcje i rozpoznawalne elementy, nie CAD.
- **Konflikty:** ograniczone przez własność katalogów i worktree; największe ryzyko to faza 0, dlatego dostaje najmocniejszy model.
- **Pamięć kontekstu:** obecny plik ma ~54k tokenów, dlatego rozbicie na moduły jest warunkiem dla reszty.

## Źródła researchu

- [What Makes an FPS Feel Good? (StraySpark)](https://www.strayspark.studio/blog/fps-game-design-fundamentals-ue5)
- [Weapon recoil camera shake: spring vs curve (StraySpark)](https://www.strayspark.studio/blog/weapon-recoil-camera-shake-ue5-spring-vs-curve)
- [Unity procedural recoil (baks.verde.ag)](https://baks.verde.ag/unity-procedural-recoil.html)
- [Recoil for viewmodel (Roblox DevForum)](https://devforum.roblox.com/t/recoil-for-viewmodel/2180687)
