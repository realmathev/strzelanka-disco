// Obrażenia obszarowe wrogów dla KAŻDEGO gracza (co-op). Solo: fn('me', true) raz, bez zmian zachowania.
// Host co-op: DS.net.forPlayers podstawia pod P (i S.G.dead) kolejno każdego gracza w runie; hurt/knock/stun trafiają do właściwej osoby.
// Klient co-op: nic (obrażenia liczy host i przysyła je w snapshocie).
import {DS} from '../core/ds.js';

/** fn(klucz gracza, czyCelAI). */
export function eachPlayer(fn){
  const N=DS.net;
  if(N.isClient())return;
  if(N.isHost()&&N.forPlayers)N.forPlayers(fn);
  else fn('me',true);
}
/** Czy klucz z eachPlayer oznacza gracza tej karty (wstrząs ekranu, napisy tylko u siebie). */
export const isLocal=k=>k==='me'||(!!DS.net.me&&k===DS.net.me());
/** Czy gracz `k` już oberwał (o[key]: false/undefined = nikt, true = wszyscy, obiekt = per gracz). */
export function isDone(o,key,k){const v=o[key];return v===true||!!(v&&typeof v==='object'&&v[k])}
/** Jednorazowe trafienie per gracz: zwraca true przy pierwszym wywołaniu dla `k` i zapamiętuje w o[key] (false/undefined = nikt). */
export function hitOnce(o,key,k){
  const v=o[key];
  if(v===true)return false;
  if(v&&typeof v==='object'){if(v[k])return false;v[k]=true;return true}
  o[key]={[k]:true};return true;
}
