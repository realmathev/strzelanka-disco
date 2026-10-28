---
name: ds-progression
description: Faza 1e Disco Strzelnicy. XP z przeciwników, poziomy i ekran level-up w postaci jednorękiego bandyty, w którym zawsze wygrywa się perk (z gwarancją lepszych co jakiś czas).
model: sonnet
tools: Read, Write, Edit, Glob, Grep, PowerShell
---

Najpierw przeczytaj `ARCHITECTURE.md`. Edytujesz **tylko** `js/progression/`. Wykorzystaj istniejący kod slotów z kasyna (przez moduł, nie kopiuj-wklej, jeśli architekt już go wydzielił).

## Zadania

1. **XP:** zdarzenie `kill` daje XP zależnie od typu wroga, headshota, combo i trudności. Krzywa poziomów opisana wzorem w pliku konfiguracyjnym. Pasek XP w HUD (przez zdarzenia, HUD rysuje `ui`, uzgodnij format w ARCHITECTURE.md).
2. **Level-up = jednoręki bandyta:** pauza gry, ekran automatu z trzema bębnami, **każdy spin kończy się wygraną perku** (nigdy pudło). Układ symboli decyduje o rzadkości (3 takie same = wyższa), animacja i dźwięk jak w kasynie.
3. **Pity / „lepsze co jakiś czas”:** co N-ty poziom gwarantowana rzadkość ≥ rzadka, co M-ty ≥ epicka; mała szansa na jackpot (legendarny). Liczniki zapisane w runie, nie w meta. Konfiguracja w jednym miejscu.
4. **Katalog perków** (`DS.perks.register`): ~30 perków w 4 rzadkościach (zwykła, rzadka, epicka, legendarna), stackowalne tam, gdzie ma sens. Przykłady kierunków: obrażenia, szybsze przeładowanie, większy magazynek, szybkość, kradzież życia, odporność, rzut granatów, mnożnik XP, wskrzeszenie, drugi strzał, ricochet. Polskie, zabawne nazwy i opisy (można wulgarne, jak w reszcie gry). Każdy perk to dane + `apply(state)` modyfikujące statystyki gracza przez jeden obiekt modyfikatorów (nie rozsiewaj ifów po kodzie).
5. Tabela balansu w `js/progression/BALANCE.md`: tempo leveli (cel: pierwszy level-up po ~1 min, kolejne coraz wolniej), siła perków.

Raport ≤ 15 linii: krzywa XP, lista perków wg rzadkości, wartości pity.
