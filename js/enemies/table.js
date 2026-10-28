// Tabela spawnu: DS.enemies.table(levelId, wave) -> wagi, limity i pula bossów dla poziomu i fali.
// Poziom może nadpisać dowolne pole przez `level.enemies = {weights:{typ:waga}, caps:{typ:max}, maxAlive, boss:{every, pool:[...]}, mul:{typ:mnożnik}}`.
import {DS} from '../core/ds.js';

// from = pierwsza fala, w = waga bazowa + przyrost na falę (w0 + w1*fala), cap = limit naraz (fn fali)
const TYPES={
  gangster:{from:1,w0:62,w1:-4,min:18,cap:()=>99},
  dres:{from:2,w0:26,w1:2,cap:w=>2+Math.floor(w/3)},
  bandyta:{from:3,w0:20,w1:2,cap:w=>2+Math.floor(w/4)},
  ochroniarz:{from:4,w0:16,w1:1.5,cap:w=>1+Math.floor(w/5)},
  pijak:{from:4,w0:18,w1:1,cap:()=>4},
  kamikadze:{from:5,w0:14,w1:1.5,cap:w=>Math.min(4,1+Math.floor(w/4))},
  snajper:{from:6,w0:12,w1:1,cap:w=>Math.min(3,1+Math.floor((w-6)/6))},
  medyk:{from:7,w0:10,w1:1,cap:w=>Math.min(2,1+Math.floor((w-7)/6)),needsAllies:2},
  kierowca:{from:8,w0:9,w1:1,cap:w=>w>=16?2:1},
};
// Klimat poziomu: mnożniki wag (identyfikatory z PLAN.md; nieznany poziom = domyślny bez mnożników).
const THEMES={
  remiza:{mul:{dres:1.1,pijak:1.2},boss:['gangster:boss','boss_dj','boss_jednooki']},
  blokowisko:{mul:{dres:1.7,pijak:1.6,kierowca:1.4,ochroniarz:.5},boss:['boss_jednooki','boss_dj']},
  kasyno:{mul:{ochroniarz:2.2,bandyta:1.3,snajper:1.3,kierowca:0,pijak:.6,dres:.7},boss:['boss_szef_ochrony','boss_jednooki']},
  dworzec:{mul:{kamikadze:1.5,snajper:1.2,ochroniarz:1.2,kierowca:.4},boss:['boss_dyzurny','boss_jednooki']},
  dyskoteka:{mul:{pijak:2,dres:1.5,kierowca:1.6,snajper:.5,ochroniarz:.4},boss:['boss_soltys','boss_dj']},
  stacja:{mul:{kierowca:2.2,kamikadze:1.6,bandyta:1.2,pijak:.6},boss:['boss_szef_stacji','boss_jednooki']},
};
const DEFAULT_BOSSES=['gangster:boss','boss_dj','boss_jednooki'];

/** 'typ' albo 'typ:boss' -> {type, opts}. */
const bossEntry=s=>typeof s==='string'?{type:s.split(':')[0],opts:s.endsWith(':boss')?{boss:true}:{}}:s;

/**
 * Zwraca {level, wave, weights, caps, maxAlive, needsAllies, boss:{every, pool, pick(wave)}}.
 * weights i caps zawierają tylko typy zarejestrowane w DS.enemies i odblokowane w tej fali (waga > 0).
 */
export function table(levelId,wave){
  const w=Math.max(1,wave|0),th=THEMES[levelId]||{mul:{},boss:DEFAULT_BOSSES};
  const lv=DS.levels.has(levelId)?DS.levels.get(levelId):null,ov=(lv&&lv.enemies)||{};
  const weights={},caps={},needsAllies={};
  for(const id in TYPES){
    const t=TYPES[id];
    if(!DS.enemies.has(id)||w<t.from)continue;
    let wt=Math.max(t.min||0,t.w0+t.w1*(w-t.from+1));
    wt*=(th.mul[id]===undefined?1:th.mul[id])*((ov.mul&&ov.mul[id])===undefined?1:ov.mul[id]);
    if(wt<=0)continue;
    weights[id]=Math.round(wt*10)/10;caps[id]=Math.max(1,t.cap(w));
    if(t.needsAllies)needsAllies[id]=t.needsAllies;
  }
  if(ov.weights)for(const id in ov.weights){if(DS.enemies.has(id)){weights[id]=ov.weights[id];if(!caps[id])caps[id]=99}}
  if(ov.caps)for(const id in ov.caps)if(weights[id]!==undefined)caps[id]=ov.caps[id];
  const every=(ov.boss&&ov.boss.every)||5;
  const pool=((ov.boss&&ov.boss.pool)||th.boss||DEFAULT_BOSSES).map(bossEntry).filter(b=>DS.enemies.has(b.type));
  if(!pool.length)pool.push({type:'gangster',opts:{boss:true}});
  return {level:levelId,wave:w,weights,caps,needsAllies,maxAlive:Math.min(8+Math.floor(w/3),30),
    boss:{every,pool,pick:wv=>pool[(Math.max(1,Math.round(wv/every))-1)%pool.length]}};
}
DS.enemies.table=table;
