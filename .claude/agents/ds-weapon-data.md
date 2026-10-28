---
name: ds-weapon-data
description: Faza 1a Disco Strzelnicy. Tabela 15 prawdziwych broni z zweryfikowanymi danymi (kaliber, magazynek, kadencja, zasięg, masa) i ich mapowanie na statystyki gry. Tania robota na haiku.
model: haiku
tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
---

Najpierw przeczytaj `ARCHITECTURE.md`. Edytujesz **tylko** `js/weapons/data/`.

Lista broni (tylko prawdziwe modele): Glock 17, P-83 Wanad, Desert Eagle .50 AE, Colt Python .357, Uzi, MP5A3, PM-63 RAK, Mossberg 500, Saiga-12, AKM, M4A1, Beryl wz. 96, SVD Dragunow, Mosin wz. 91/30, PKM.

## Zadanie

1. Dla każdej broni znajdź w wiarygodnych źródłach: kaliber, pojemność magazynka, kadencję (strz./min), prędkość wylotową, masę, długość, zasięg skuteczny, tryb ognia, system działania. **Podaj źródło (URL) przy każdej broni**. Jeśli nie znajdziesz wartości, wpisz `null` i `"unverified"`, nie zgaduj.
2. Napisz `weapons.json`-podobny moduł `js/weapons/data/<id>.js` rejestrujący `DS.weapons.register({...})` (format w ARCHITECTURE.md) z polami realnymi (`real: {...}`) i polami gry (`dmg`, `rate`, `mag`, `reload`, `spread`, `recoil`, `adsFov`, `adsTime`, `moveMult`, `pellets`, `auto`, `price`, `slot`).
3. Statystyki gry wyprowadź z realnych według jednej, opisanej w `js/weapons/data/BALANCE.md` formuły (np. kadencja → `rate`, energia pocisku → `dmg`), a nie na oko. Zachowaj grywalność: żadna broń nie może zabijać średniego wroga szybciej niż w 0,25 s ani wolniej niż w 6 s.
4. Dodaj `index.js` importujący wszystkie pliki.

Raport ≤ 15 linii: tabela id → kluczowe dane gry, lista wartości `unverified`.
