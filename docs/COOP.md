# Co-op (JuicyJuicy rooms) — projekt

Cel: 2–4 graczy przechodzi razem kolejne poziomy kampanii (remiza → blokowisko → kasyno → dworzec → dyskoteka → stacja).
Transport: oficjalny snippet `docs/juicy/multiplayer-snippet.js` (wklejony bez zmian w `index.html`), reguły w `docs/juicy/multiplayer-rules.txt`.
Model JuicyJuicy: przeglądarka hosta prowadzi grę, pozostali wysyłają do niej swoje wejście; relay przekazuje JSON (≤16 KB, ≤60 wiadomości/s na gracza).

## Decyzje

| Temat | Decyzja |
|---|---|
| Liczba graczy | `create({max:4})` — wydajność (30 wrogów + 4 awatary) i czytelność. |
| Autorytet | Host: fale, spawn i AI wrogów, HP wrogów, bossowie, pociski wrogów, pickupy, beczki, drzwi/sekrety, `levelComplete`, wybór poziomu. |
| Ruch gracza | Każdy klient symuluje WŁASNY ruch lokalnie (zero opóźnienia) i wysyła stan ~20 Hz: `pos, yaw, pitch, weapon, ads, crouch?, anim`. Host ufa (co-op ze znajomymi, bez anti-cheatu). |
| Strzelanie | Klient raycastuje lokalnie w repliki wrogów i świat (efekty, tracer, hitmarker natychmiast), wysyła `hit {eid, dmg, head, point}`; host stosuje `damageEnemy` (z `beforeHit`, tarczą itd.) i rozsyła wynik. Pozostali widzą tracer/błysk z wiadomości `shot`. |
| Obrażenia gracza | Host liczy ataki wrogów na najbliższego/widzianego gracza (AI musi celować w dowolnego gracza, nie tylko `P`) i wysyła `hurt {dmg, from}` do ofiary; klient stosuje pancerz i własne HP lokalnie. |
| Śmierć | Gracz „powalony” (leży, może być podniesiony przez kumpla: przytrzymaj E 3 s w promieniu 2 m) albo wraca na początku następnej fali z 50% HP. Run kończy się, gdy wszyscy leżą. |
| Skalowanie trudności | HP wrogów ×(1 + 0,6·(n−1)), `maxAlive` ×(1 + 0,35·(n−1)) ograniczone do 30; boss HP ×(1 + 0,75·(n−1)). |
| Ekonomia i postęp | Każdy gracz ma WŁASNY zapis (ZD, bronie, skórki, perki, poziom XP). XP i ZD za zabójstwo dostaje strzelec; asysta (≥25% obrażeń) daje 50% XP. Znajdźki zbiera każdy osobno (pickup lokalny, host tylko pilnuje, że jest na mapie). `levelsDone` zapisuje się u każdego obecnego gracza. |
| Level-up | Jednoręki bandyta otwiera się lokalnie i NIE pauzuje gry w co-op (gra toczy się dalej; gracz ma 3 s nietykalności po wyborze). Pauza (Esc/P) w co-op tylko lokalne menu, bez zatrzymania świata. |
| Poziomy | Host wybiera poziom w lobby; „Dalej” na ekranie ukończenia przełącza wszystkich (`level {id}` → klienci `loadLevel`). Losowość mapy przez seed od hosta. |
| Dołączanie w trakcie | Dozwolone między falami: klient dostaje `snapshot` pełny (poziom, fala, wrogowie, pickupy, stan drzwi/beczek), pojawia się przy punkcie startu. Host może zablokować pokój (`lock`). |
| Odejście hosta | JuicyJuicy przenosi rolę hosta (`host` event). Pierwsza wersja: run kończy się z komunikatem „Host wyszedł — wróć do lobby”; migracja stanu na nowego hosta to etap 4. |

## Wiadomości (pole `k`)

- klient → host: `in` (stan gracza ~20 Hz), `hit`, `shot` (efekt), `use` (drzwi/winda/automat), `revive`, `ready`, `pick` (prośba o pickup)
- host → wszyscy: `snap` (~15 Hz, kompakt: wrogowie `[eid,type,x,z,ry,hp,state,anim]`, gracze, pociski wrogów), `ev` (zdarzenia: spawn/kill/boss/phase/explode/puddle/door/pickup/wave/announce), `level`, `start`, `end`, `hurt` (do ofiary), `full` (pełny stan dla dołączającego)
- Budżet: `snap` ≤ 6 KB przy 30 wrogach (liczby zaokrąglone do 0,01 m; delty/klatki kluczowe opcjonalnie).

## Klient (repliki)

- Wróg u klienta = model z `js/enemies` (te same fabryki modeli) bez AI; pozycja/rotacja interpolowana między snapshotami (bufor ~100 ms), animacje z pola `anim/state`.
- Efekty bossów (kałuże, pasy zapowiedzi, przywołania) jako zdarzenia `ev` odtwarzane lokalnie bez logiki obrażeń (obrażenia liczy host i przysyła `hurt`).
- Awatary innych graczy: proceduralny model postaci + trzymana broń (`getWorldModel`), nick nad głową (`textContent` w sprite/canvas, bez HTML), znacznik koloru gracza.

## UI

- Menu główne: „Graj ze znajomymi” → lobby: Utwórz pokój / Dołącz kodem (6 znaków) / zaproszenie z linku (`rooms.invited()` przy starcie gry otwiera lobby od razu). Lista graczy (nazwy przez `textContent`), gotowość, host wybiera poziom i trudność, przycisk „Zaproś” (`room.invite()`), kod pokoju do skopiowania.
- HUD w co-op: paski HP i stan (powalony) kolegów, znaczniki kolegów na krawędzi ekranu, komunikaty dołączenia/wyjścia.
- Brak czatu tekstowego (reguła JuicyJuicy). Opcjonalnie gotowe komunikaty („Tutaj!”, „Pomocy!”) pod klawiszem.
- Niezalogowany na JuicyJuicy: komunikat z błędu `rooms.create/join` (JuicyJuicy sam proponuje logowanie).

## Etapy

1. Fundament: snippet, `js/net/` (sesja, protokół, interpolacja), lobby, awatary, wspólny wybór poziomu i start, synchronizacja fal i wrogów (bez bossów), strzelanie/obrażenia, powalenie i podnoszenie, ekran końca. Test: dwie karty tej samej strony (BroadcastChannel).
2. Bossowie, pociski i efekty wrogów, pickupy, beczki, drzwi/windy/sekrety, automaty, `levelComplete` i „Dalej” dla wszystkich.
3. Dołączanie w trakcie (`full`), reconnect, skalowanie trudności, HUD kolegów, polerka.
4. (opcjonalnie) migracja hosta.

## Stan: etap 1 zrobiony (kod: `js/net/`, protokół i hooki: ARCHITECTURE.md „Sieć / co-op”, test: `node tests/coop.js 4203 --gpu`)

Działa: snippet + feature `multiplayer`; lobby (utwórz / dołącz kodem / link `?room=` z `rooms.invited()`, lista graczy z kolorami, gotowość,
host wybiera poziom i trudność, „Zaproś”, „Kopiuj kod”, wyjście, komunikaty błędów po polsku); start u wszystkich na tym samym poziomie z trudnością hosta;
własny ruch + `in` 20 Hz, awatary z interpolacją 100 ms; host: fale, spawn, AI celujące w najbliższego widocznego gracza, skalowanie HP i `maxAlive`;
repliki u klientów; trafienia klienta liczone u hosta, nagroda dla strzelca, asysta 50% XP; rany od AI do ofiary; powalenie, podnoszenie (E 3 s, 2 m),
powrót w następnej fali z 50% HP; koniec runu, gdy leżą wszyscy (tabela wszystkich graczy na ekranie końca, „Wróć do lobby”); level-up i pauza bez zatrzymania świata.

Zmiany względem decyzji (powód: limit 60 wiadomości/s na gracza):
- `hit` jest polem `h` wiadomości `shot` (jedna wiadomość na strzał zamiast dwóch).
- `ev` i `hurt` jadą w polach `ev` i `hu` snapshotu (≤ 66 ms opóźnienia), a nie jako osobne wiadomości.
- `in` idzie od każdego gracza do wszystkich (także od hosta), awatary nie czekają na przekaźnik hosta.
- Podniesienie przez kumpla też daje 50% HP.
- Bossowie w co-op wyłączeni w etapie 1: fala bossa jest zwykłą falą (repliki bossów, ich efekty i `levelComplete` to etap 2).
- Wyjście hosta z runu (pauza → „Wyjdź”) kończy run wszystkim; wyjście klienta (`out`) zostawia grę pozostałym.

Znane braki (etap 2/3): pociski łukowe, kałuże i wybuchy wrogów ranią tylko hosta (u klientów brak ich efektów); pickupy, beczki, drzwi i automaty
są lokalne; brak HUD-u kolegów (pasków HP), dołączania w trakcie (`full`), reconnectu i migracji hosta; karta w tle nie wysyła stanu.

## Bezpieczeństwo

Wszystko, co przychodzi z sieci, to dane: `JSON` z relaya waliduj (typy, zakresy, istniejące `eid`), nazwy graczy tylko przez `textContent`, żadnego `innerHTML`/`eval` na danych od innych graczy. Limity: odrzucaj wiadomości > 16 KB i nadmiar częstotliwości po stronie hosta (ignoruj, nie crashuj).
