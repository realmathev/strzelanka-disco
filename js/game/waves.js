// Fale wrogów: kolejka spawnu, premia za czystą falę, boss co 5 fal.
// Co-op (host): maxAlive skalowane liczbą graczy (HP bossa: manager/DS.net.hpScale), fala czeka, aż nie leżą wszyscy.
import {$,rand,pick} from '../core/util.js';
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {announce} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {world} from '../world/state.js';
import {makeEnemy} from '../enemies/manager.js';

const NARR=['Godzina 23:14. Parking pod remizą. Ktoś przyniósł za dużo amunicji.','Gang Jednorękiego Bandyty chce odzyskać swoje automaty.','DJ nie przestaje grać. Ty też nie przestawaj.','Kanarkowe marynarki wracają. Jest ich więcej.','Ktoś w kasynie właśnie trafił trzy siódemki. Gang jest wściekły.','Sołtys zamknął drzwi od środka. Zostałeś sam z orkiestrą.','Disco do rana. Jeśli dożyjesz.'];
export function nextWave(){
  const G=S.G,coop=DS.net.isHost();
  G.wave++;G.boss=G.wave%5===0;G.queue=3+G.wave*2;G.spawnT=.5;
  // Limit żywych naraz z tabeli spawnu poziomu (8 + fala/3, max 30; poziom może nadpisać enemies.maxAlive).
  const tb=DS.enemies.table?DS.enemies.table(world.level&&world.level.id,G.wave):null;G.maxAlive=tb&&tb.maxAlive>0?tb.maxAlive:8;
  if(coop){DS.net.rescale();G.maxAlive=Math.min(30,Math.round(G.maxAlive*DS.net.aliveScale()))}   // liczba graczy (dołączający) liczy się od tej fali
  let bossName='Baron Jackpot';
  if(G.boss){const b=makeEnemy(true);if(b&&b.name)bossName=b.name;G.queue=Math.max(2,G.queue-4)}
  waveIntro(G,bossName);
  DS.bus.emit('waveStart',{wave:G.wave,boss:G.boss,count:G.queue+(G.boss?1:0),bossName:G.boss?bossName:undefined});
}
/** Napis i narracja na starcie fali (co-op: klient woła to po zdarzeniu fali od hosta). */
export function waveIntro(G,bossName='Baron Jackpot'){
  sfx('wave');announce('FALA '+G.wave,G.boss?'Wchodzi '+bossName:'');
  const n=$('#narr');n.textContent=G.boss?(bossName==='Baron Jackpot'?'Baron Jackpot osobiście. Złota marynarka, zero litości.':bossName+' wchodzi na arenę. Nie daj się zagadać.'):pick(NARR);n.hidden=false;clearTimeout(n._t);n._t=setTimeout(()=>n.hidden=true,4200);
}
/** Premia za czystą falę (każdy gracz dostaje ją do własnego zapisu; co-op: klient po zdarzeniu 'clear' od hosta). */
export function waveClearReward(G){
  const bonus=40*G.wave;save.coins+=bonus;G.earned+=bonus;announce('FALA CZYSTA!','+'+bonus+' ZD premii');sfx('win');
  if(Math.random()<.3){save.keys++;G.keysFound++;setTimeout(()=>{if(S.G)announce('KLUCZ!','Premia za falę')},1300)}persist();
}
/** Spawn z kolejki (limit G.maxAlive żywych naraz, domyślnie 8) i przejście do kolejnej fali. */
export function updateWaves(dt,alive){
  const G=S.G,down=DS.net.isHost()?DS.net.allDown():G.dead;   // co-op: fala idzie dalej, dopóki ktoś stoi
  if(G.queue>0){G.spawnT-=dt;if(G.spawnT<=0&&alive<(G.maxAlive||8)){makeEnemy(false);G.queue--;G.spawnT=rand(.8,1.6)}}
  else if(alive===0&&!down){
    if(G.between<=0&&G.wave>0&&!G.cleared){G.cleared=true;G.between=4;waveClearReward(G);DS.bus.emit('waveClear',{wave:G.wave})}
    G.between-=dt;if(G.between<=0){G.cleared=false;nextWave()}
  }
}
