# Prośby od ds-healing (poza js/pickups/)

1. **game/combat.js, `hurt(d)`**: pancerz (kamizelka) pochłania część obrażeń. Dodaj import
   `import {absorbDamage} from '../pickups/index.js';` (lub `../pickups/armor.js`) i na początku `hurt`,
   przed `G.hp-=d`: `d=absorbDamage(d);`. Zwraca obrażenia, które trafiają w HP. Dla `d<=0` reszta bez zmian.
2. **game/combat.js, `killEnemy`**: usuń linię `if(Math.random()<.11)spawnPickup('med',pos,30);`.
   Dropy z wrogów (apteczka, bandaż, adrenalina, jedzenie, kamizelka) losuje `pickups/drops.js` ze zdarzenia `kill`,
   z szansą rosnącą przy niskim HP. Bez tego apteczka może spaść podwójnie.
3. **player/ lub gunfeel/**: adrenalina. Gdy `S.G.adrenT>0`, mnóż prędkość biegu przez `CFG.adrenaline.sprintMul` (1.35)
   i odrzut przez `CFG.adrenaline.recoilMul` (0.7). Wartości w `js/pickups/config.js`. Timer już się zmniejsza.
4. **ds-level-designer, `build(world)` poziomu**: automaty i stacje leczenia stawiaj przez
   `import {placeHealMachine} from '../../pickups/index.js'`, np.
   `placeHealMachine({kind:'vending', x:4, z:-6, rotY:0})` (`kind`: `'vending'` albo `'station'`).
   Kolizja dodawana jest do `world.colliders`. Sprzątanie: `clearHealMachines()`.
   Stan (użycie, cooldown) resetuje się sam przy `levelStart`.
5. **ds-input-menus**: (a) opcja trudności `difficulty: 'easy'|'normal'|'hard'` w `DEF_OPT` (domyślnie `'normal'`),
   używana przez regenerację tarczy (`CFG.shield.regen`); (b) akcja `use` (E, `DS.input.register` w `pickups/machines.js`)
   ma być widoczna w Sterowaniu i rebindowalna; sprawdź konflikty z innymi akcjami.
6. **ui/hud**: słuchaj `DS.bus.on('armor', ({armor,max}) => ...)` (pasek pancerza). Zdarzenie `heal` z `source:'pickup'`
   obejmuje teraz bandaż, adrenalinę, jedzenie i automaty.
