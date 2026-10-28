# js/enemies — wrogowie (ds-enemy-designer)

Kontrakt rejestru (`DS.enemies.register`) i zdarzenia: `ARCHITECTURE.md`. Tu: co dokłada ta domena.

## Pliki
| plik | rola |
|---|---|
| `manager.js` | `spawnEnemy` (mnożniki trudności, spawn **poza polem widzenia**, `opts.at`), `makeEnemy` (wołane przez `game/waves.js`: typ z tabeli / boss poziomu), `updateEnemies`, dropy typu ze zdarzenia `kill` |
| `table.js` | `DS.enemies.table(levelId, wave)` → `{weights, caps, maxAlive, needsAllies, boss:{every,pool,pick(wave)}}`; poziom może nadpisać `level.enemies` |
| `ai.js` | automat stanów, percepcja, ruch, animacje, „ragdoll-lite”; typ podaje tylko `cfg` + hooki |
| `nav.js` | siatka z `level.nav` albo z `world.colliders`, A* z budżetem węzłów/klatkę, LOS po siatce, osłony |
| `kit.js` | współdzielone geometrie, scalanie części w siatki (kolory wierzchołków), szkielet człowieka, składanie grupy |
| `proj.js` | pociski po łuku (butelka, żeton, petarda), wybuchy, fale uderzeniowe, kałuże, wiązki |
| `esfx.js` | dźwięki `e_*` w `sfxBank` |
| `common.js` / `boss.js` | fabryka człowieka + atak wręcz / pasek, fazy i silnik akcji bossów |
| `gangster.js` | pierwotny wróg jako „Bandyta” (zachowanie bez zmian), boss Baron Jackpot |
| `dres.js … kierowca.js`, `bosses.js` | typy |
| `selftest.js` | testy samoczynne areny (`tools/enemy-test.html`, `ARENA.selfTest()`) |

## Typy (`id`) i pola przekazywane do reszty gry
`gangster` (Bandyta), `dres`, `ochroniarz`, `bandyta` (z obrzynem), `snajper`, `pijak`, `kamikadze`, `medyk`, `kierowca`, `boss_dj`, `boss_jednooki`, `boss_szef_ochrony`.
Wróg ma `name`, `xp` (czyta je progresja), `boss`, `hp/maxHp/dmg` (pomnożone przez trudność w `spawnEnemy`), a typ może mieć `drops:[{kind,p,val?}]`, `onKill(e)`, `silentDie(e)`.

## Jak dodać typ
```js
import {makeHuman, reg, wv, aiOpts} from './common.js';
reg('id','Nazwa', (o={}) => makeHuman({key:'id'+wariant, build:(P,meta)=>{ /* humanBase(P,meta,{...}) + dodatki */ },
  hp:wv(60,6,o.wave), dmg:wv(8,.5,o.wave), name:'Nazwa', xp:10,
  cfg:{speed:3.4, range:[6,14], flank:.3, cover:.2, fleeHp:0, attack(e,dt,ctx){…}, states:{własny:{enter,update,locked}}},
  opts:aiOpts(o)}), {drops:[{kind:'med',p:.1}]});
```
Potem `import './id.js'` w `index.js`, wpis w `TYPES` w `table.js` (wagi i limity) i scenariusz w `selftest.js`.

## Stany AI
`patrol → alert → chase → (flank | cover | attack) → flee`, plus stany typu (`wind/charge/recover` dresa, `fuse/toss` kamikadze, `heal` medyka,
`rev/charge/brake/crash` Malucha, `reposition` snajpera). `e.ai.state` jest widoczny w arenie (etykiety nad głowami).
Zdarzenia szyny od bossów: `bossHp {enemy,hp,max,name,phase}`, `bossPhase {enemy,phase,name}`.
