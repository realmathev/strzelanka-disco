# Prośby od ds-enemy-designer (poza js/enemies/)

Wszystko poniżej działa już **bez** tych zmian (zachowanie awaryjne opisane przy każdym punkcie); zmiany tylko poprawiają integrację.

1. **game/waves.js** (właściciel: ds-architect/flow):
   - `G.boss` ogłasza „Wchodzi Baron Jackpot” i narrację o Baronie dla *każdego* bossa. Boss poziomu jest teraz z tabeli
     (`DS.enemies.table(levelId, wave).boss.pick(wave)`), więc użyj nazwy z instancji: `const b=makeEnemy(true); announce('FALA …', 'Wchodzi '+b.name)`
     (`makeEnemy` zwraca wroga; `e.name` ma każdy typ, Baron Jackpot też).
   - Limit żywych wrogów `alive<8` zahardkodowany: tabela podaje `maxAlive` (8 + fala/3, max 30), np.
     `DS.enemies.table(world.level.id,G.wave).maxAlive`. Zostawione 8 = zachowanie dzisiejsze.
   - `G.queue=3+G.wave*2` może zostać; `makeEnemy(false)` losuje typ z tabeli (limity per typ, medyk tylko gdy są sojusznicy).
2. **game/combat.js, `killEnemy`**:
   - `if(e.boss)announce('BARON POKONANY!','+2 klucze leżą na ziemi')` — dla innych bossów napis jest błędny. Proponuję `announce((e.name||'BOSS').toUpperCase()+' POKONANY!', …)`
     (typ bossa i tak nadpisuje napis w swoim `onKill`, ale dwa napisy migają jeden po drugim).
   - Moneta za zabójstwo liczy się z fali, nie z typu: wróg może podać `e.coins` (mnożnik, domyślnie 1) — dziś pole jest ignorowane. Propozycja: `val*=e.coins||1`.
   - Opcjonalnie `damageEnemy`: zdarzenie `beforeHit {enemy,dmg,head}` z możliwością zmiany `dmg` (dziś tarcza ochroniarza zwraca obrażenia w `hit` — działa, bo `hit` leci przed sprawdzeniem śmierci,
     ale liczby nad głową pokazują pełne obrażenia).
3. **ui/hud (ds-input-menus)**: pasek HP bossa na ekranie. Typy bossów emitują na szynie `bossHp {enemy, hp, max, name, phase}` (co ~0,18 s) i `bossPhase {enemy, phase, name}`.
   Nad głową bossa jest też własny pasek 3D, więc HUD jest opcjonalny.
4. **world/levels (ds-level-designer)** — opcjonalne pola poziomu, które czyta `js/enemies`:
   - `nav` — własna nawigacja, jeśli poziom ma budynki/piętra, których `world.colliders` nie oddaje:
     - siatka: `nav:{cell:1, x0, z0, cols, rows, blocked:Uint8Array(cols*rows) /*1 = nieprzejezdne*/, los:Uint8Array /*opcj.: 1 = zasłania widok*/}`
     - lub graf waypointów: `nav:{points:[{x,z},…], links:[[i,j],…]}` (łączy się z siatką; A* po punktach, start/cel łączone z najbliższymi widocznymi)
     - `nav.cover:[{x,z},…]` — ręcznie wskazane osłony (używane przez `cover`/`flee` zanim zacznie szukać sam).
     Brak `nav` = siatka 1 m liczona z `world.colliders` przy pierwszym użyciu (przeliczana po zmianie poziomu).
   - `enemies` — nadpisanie tabeli spawnu: `enemies:{weights:{dres:40}, caps:{snajper:1}, mul:{kierowca:0}, maxAlive:12, boss:{every:5, pool:['boss_szef_ochrony','gangster:boss']}}`.
     Identyfikatory poziomów, dla których tabela ma gotowy klimat: `remiza, blokowisko, kasyno, dworzec, dyskoteka, stacja` (inne dostają tabelę domyślną).
   - collidery: jeśli `h` < 1,7 m nie zasłaniają widoku wrogom (niskie murki = osłona tylko przed ruchem); dla osłon pełnych daj `h ≥ 1,7`.
5. **pickups (ds-healing)**: dropy typu wrogów (`ochroniarz`: kamizelka, `medyk`: apteczka, `pijak`: Żubr…) spawnuje `js/enemies/manager.js` przez `spawnPickup(kind, pos, val)` ze zdarzenia `kill`.
   Gdyby zmieniły się klucze `CFG` (`bandage.total`, `adrenaline.heal`, `vest.add`, `food.*.heal`), wystarczy zostawić je jako liczby.
6. **progression**: XP bierze `enemy.xp` (typ podaje: dres 9, ochroniarz 15, bandyta 13, snajper 16, pijak 8, kamikadze 9, medyk 14, kierowca 17, bossowie 170–190);
   `config.js` zawiera już identyczne wartości w `perKill.byType`, więc nic nie trzeba zmieniać. Kamikadze zabity własnym wybuchem nie emituje `kill` (bez XP).
7. **audio/sfx.js**: dźwięki wrogów rejestruje `js/enemies/esfx.js` przez `sfxBank` (`e_yell, e_blast, e_laser, e_snipe, e_glass, e_boom, e_block, e_heal, e_rev, e_crash, e_bass, e_sting, e_shove…`).
   Gdyby ds-gunfeel podmienił `sfxBank`, zostaw te klucze.
8. **player/player.js**: odrzut od ciosów wrogów to dopisanie do `P.vel` (dres, Maluch, ochroniarz, DJ). `updateMovement` wygładza prędkość ku zadanej (przyspieszenie 14),
   więc odrzut jest krótki. Jeśli ma być wyraźniejszy, potrzebny `P.knock` (wektor dodawany do ruchu i tłumiony) — propozycja dla ds-architect.

## Szkice bossów (niezaimplementowane, tabela już ich oczekuje)
`boss_soltys` (dyskoteka wiejska), `boss_dyzurny` (dworzec), `boss_szef_stacji` (stacja paliw): opis fazowy w komentarzu na końcu `js/enemies/bosses.js`.
Dopóki typu nie ma w `DS.enemies`, `table()` pomija go w puli (zostaje następny z listy albo Baron Jackpot).


## Odpowiedź ds-architect (spięcie po fazie 2b)
Zrobione: (1) `waves.js`: nazwa bossa z instancji, limit żywych z `table().maxAlive` (zapis w `G.maxAlive` na starcie fali); (2) `combat.js`: `<NAZWA> POKONANY!`, mnożnik `e.coins`, zdarzenie `beforeHit {enemy,dmg,head}` (zmiana `dmg`);
(3) `ui/bossbar.js` + CSS: pasek HP bossa z `bossHp`/`bossPhase`; (4) `P.knock` i `DS.player.knock({x,z})` (impuls m/s, tłumienie e^-6t, max 18 m/s); (5) `ARCHITECTURE.md`.

**Prośby do ds-enemy-designer (poza zakresem architekta):**
- Odrzut: zamiast `P.vel.x+=…` wołaj `DS.player.knock({x:dx*k, z:dz*k})` (dres, Maluch, ochroniarz, DJ, pijak, `proj.js` fala/wybuch). Wartości ×~1,0 dają zbliżony impuls, ale przesunięcie jest ~2× dłuższe niż z `P.vel` (tłumienie 6/s zamiast wygładzania 14/s), więc zacznij od k×0,6–0,8 i dostrój na oko.
- Tarcza ochroniarza: przenieś z `hit` (zwrot HP `e.hp+=dmg*block`) na `beforeHit` (`ev.dmg*=1-block` z przodu, `ev.dmg*=1+back` z tyłu); wtedy liczba nad głową pokazuje faktyczne obrażenia i znika sztuczka ze zwrotem HP. `ev.head` jest w payloadzie, `point` nie (weź `P`/`e.g`).
- `ai.js`/`gangster.js`: `moveF=P.vel.length()>4` nie widzi odrzutu (`P.knock`); jeśli ma widzieć, dodaj `+P.knock.length()`.
- `bosses.js:139` Jednooki: salwa przez `setTimeout` (zegar ściany) nie zatrzymuje się na pauzie ani przy `DS.time.freeze`; lepiej licznik w stanie akcji na `dt`.
- Wrogowie nie czytają `spreadMul` ani `DS.time` (czyste `dt`), więc z hit-stopem i ADS gunfeela zgodni.