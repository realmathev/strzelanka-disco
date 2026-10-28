// Dropy z wrogów: szansa rośnie, im mniej HP ma gracz (wzorzec z ARCHITECTURE/PLAN). Słucha szyny 'kill',
// więc game/combat.js nie musi nic wołać. Wagi i liczby: config.js.
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {CFG} from './config.js';
import {spawnPickup} from './pickups.js';

const MED_HEAL=30; // znajdźka 'med' (apteczka z mapy), wartość = HP
const VAL={med:MED_HEAL,bandage:CFG.bandage.total,adrenaline:CFG.adrenaline.heal,vest:CFG.vest.add,
  zapiekanka:CFG.food.zapiekanka.heal,kebab:CFG.food.kebab.heal,zubr:CFG.food.zubr.heal};

/** Losowanie z wagami: obiekt {klucz: waga} -> klucz. */
function wpick(table){
  let tot=0;for(const k in table)tot+=table[k];
  let r=Math.random()*tot;
  for(const k in table){r-=table[k];if(r<0)return k}
  return null;
}
const FOOD_W={};for(const k in CFG.food)FOOD_W[k]=CFG.food[k].w;

/** Rzut na drop w punkcie `pos` (Vector3 lub {x,z}). Zwraca typ znajdźki albo null. */
export function rollDrop(pos,boss=false){
  const G=S.G;if(!G||G.dead)return null;
  let p=CFG.drop.base+CFG.drop.lowHp*(1-G.hp/G.maxHp);
  if(boss)p=Math.min(1,p*CFG.drop.bossMul);
  if(Math.random()>=p)return null;
  let kind=wpick(CFG.drop.table);
  if(kind==='food')kind=wpick(FOOD_W);
  if(!kind||!(kind in VAL))return null;
  spawnPickup(kind,pos,VAL[kind]);
  return kind;
}

DS.bus.on('kill',({enemy})=>{
  if(!enemy||!enemy.g)return;
  rollDrop(enemy.g.position.clone(),!!enemy.boss);
});
