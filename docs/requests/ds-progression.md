# Prośby od ds-progression (poza js/progression/)

Progresja działa bez żadnych zmian w cudzym kodzie (wszystko przez `DS.bus` i nakładki na definicje). Poniżej to, co warto uporządkować.

## Format zdarzeń (do wpisania w ARCHITECTURE.md, ds-architect)

| zdarzenie | payload | kiedy |
|---|---|---|
| `xp` | `{xp, level, next, gain, total}` | po każdym przyroście XP i na `levelStart` (reset: xp 0, level 1). `xp` = postęp w bieżącym poziomie (0..next-1), `next` = próg tego poziomu, pasek = `xp/next`. `gain` = ostatni przyrost, `total` = XP w runie. |
| `levelup` | `{level}` | gdy przekroczono próg (nowy numer poziomu). Ekran automatu otwiera się ~0,7 s później. |
| `perk` | `{id, rarity, stacks, level}` | po wylosowaniu perka w automacie (już zastosowany). |
| `heal` | `source:'perk'` | nowe źródło: kradzież życia i leczenie z zabójstw. Reszta bez zmian. |
| `pause` | `true` / `false` | ekran automatu też pauzuje grę (`G.paused=true`) i emituje `pause`, ale NIE pokazuje `scrPause`. |

Dane runu dla UI (HUD, pauza, ekran końca): `DS.progression.state()` (`level, xp, total, history[{level,id,rarity,stacks}]`),
`DS.progression.owned()` (`{perkId: stacki}`), `DS.perks.get(id)` (`name, rarity, desc, max`), `DS.progression.mods()`.

## Prośby

1. **ds-architect, ARCHITECTURE.md**: sekcja `DS.perks` (kształt faktyczny): `{id, name, rarity:'common'|'rare'|'epic'|'legend', max, desc, apply(mods, n, G)}`;
   `apply` modyfikuje jedyny obiekt `G.mods` (pola w `js/progression/catalog.js`, `defaultMods()`), `n` = liczba stacków. Dopisz też tabelkę zdarzeń wyżej.
2. **game/combat.js, `die()`** (opcjonalnie, czystsze wskrzeszenie): perk „Siostra Halina” wstaje po śmierci. Dziś progresja robi to sama w `damage`
   (cofa `G.dead`, a ekran porażki zaplanowany przez `die()` na +1,4 s chowa klasą `lv-noover` na `#app`). Lepiej: w `die()` przed ustawieniem `G.dead` emitować
   `DS.bus.emit('beforeDeath', ev={cancel:false})` i przerwać, gdy `ev.cancel`; wtedy progresja podmieni się na hook i hack z `lv-noover` zniknie.
   Analogicznie `hurt(d)`: `const ev={amount:d}; DS.bus.emit('beforeDamage', ev); d=ev.amount;` (unik i redukcja obrażeń bez cofania śmierci).
3. **weapons/fire.js, pickups/pickups.js** (opcjonalnie): dziś progresja nakłada magazynek/przeładowanie/kadencję/magnes przez tymczasową zmianę definicji
   w `DS.weapons`/`DS.pickups` (`mag`, `reload`, `rate`, `magnet`) i przywraca je na `levelEnd`. Jeśli wolicie czytać modyfikatory wprost:
   `const m=DS.progression.mods()`; `G.fireT=W.rate*m.rateMul`, `G.reloadT=W.reload*m.reloadMul`, `Math.round(W.mag*m.magMul)`, `def.magnet*m.magnetMul`.
   Wtedy powiedzcie, a wyłączę nakładki (jedna funkcja `applyPatches` w `progression/state.js`).
4. **ds-input-menus / ui/hud**: pasek XP i numer poziomu z zdarzenia `xp` (jest już rysowany). Dobrze byłoby pokazać na ekranie pauzy listę perków
   (`DS.progression.owned()`). Trudność: progresja czyta `opt.difficulty` (`'easy'|'normal'|'hard'`, albo indeks 0..2), brak = normalna.
5. **ds-enemy-designer**: XP za zabójstwo wg `enemy.type` (tabela `CFG.xp.perKill.byType` w `progression/config.js`); nieznany typ liczy się z `maxHp`.
   Podaj nowe `id` wrogów i ich wagę, to dopiszę wpisy; albo ustaw w `create()` pole `e.xp` (liczba, bazowe XP): nadpisuje tabelę i bossa.
6. **game/loop.js**: ekran automatu zatrzymuje grę przez `G.paused=true`; pętla już to obsługuje (`updateGame` się nie wykonuje). Bez zmian, tylko informacja.
