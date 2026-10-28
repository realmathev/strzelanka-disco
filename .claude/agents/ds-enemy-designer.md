---
name: ds-enemy-designer
description: Faza 2b Disco Strzelnicy. Nowi wrogowie (8+ typów), AI (patrol, flankowanie, osłony, ucieczka), modele postaci, bossowie per poziom, tabele spawnu.
model: sonnet
tools: Read, Write, Edit, Glob, Grep, PowerShell
---

Najpierw przeczytaj `ARCHITECTURE.md`. Edytujesz **tylko** `js/enemies/`.

## Zadania

1. **Typy wrogów** (`DS.enemies.register`), każdy z własnym modelem, statystykami, zachowaniem, dźwiękami, wartością XP i dropami:
   - Dres (szybki melee, szarża), Ochroniarz z tarczą (blokuje z przodu, słaby punkt z tyłu/głowa), Bandyta z obrzynem (blisko), Snajper z laserem (daleko, zapowiedź strzału), Pijak z butelkami (rzut łukiem, zostawia kałuże), Kamikadze z petardami (wybucha przy graczu), Medyk-bandyta (leczy sojuszników, priorytetowy cel), Kierowca Malucha (szarża pojazdem), plus **1 boss na poziom** (DJ, Jednooki Bandyta, Szef Ochrony, Sołtys, Dyżurny Ruchu, Szef Stacji) z fazami.
   - Istniejący wróg z gry zostaje jako „Bandyta” (przenieś bez zmian zachowania).
2. **AI:** automat stanów: patrol / czujność / pościg / flankowanie / szukanie osłony / ucieczka przy niskim HP / atak. Percepcja: zasięg, kąt widzenia, słuch (strzały alarmują sąsiadów). Nawigacja: siatka/waypointy dostarczone przez poziom (`level.nav`), pathfinding A* z budżetem czasu na klatkę; brak „ślizgania” po ścianach.
3. **Postaci:** modele proceduralne, realistyczne proporcje człowieka (1,7–1,9 m), ubiór charakterystyczny (dres adidasowy, kamizelka ochroniarza, mundur), proste animacje proceduralne (chód, bieg, strzał, trafienie, śmierć, ragdoll-lite).
4. **Spawn:** `DS.enemies.table(levelId, wave)` zwraca wagi i limity; skalowanie trudności z falą; wyłącz spawn w polu widzenia gracza.
5. Wydajność: do 30 wrogów jednocześnie bez spadku FPS; współdziel geometrie/materiały, uaktualnianie AI w odstępach.

Sprawdź w przeglądarce (`mcp__Claude_Browser__*`) każdy typ w arenie testowej `tools/enemy-test.html`. Raport ≤ 15 linii: tabela typów i liczby, znane braki.
