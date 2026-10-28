// Logika przypisywania klawiszy (bez DOM): zmiana slotu, konflikty, zamiana, czyszczenie.
// UI: ui/controls.js. Wynik każdej operacji to opis zdarzenia do pokazania graczowi.
import {DS} from '../core/ds.js';
import {RESERVED,FIXED_FIRST,saveKeys,canon} from './actions.js';

const I=DS.input;
export const MAX_SLOTS=2;

/** Czy slot jest zablokowany (np. Esc w „Pauza”). */
export function isFixed(id,slot){return slot===0&&!!FIXED_FIRST[canon(id)]}
/** Inne akcje, które już używają kodu. */
export function others(id,code){id=canon(id);return I.actionsFor(code).filter(a=>a!==id)}

/**
 * Próba przypisania kodu do slotu akcji.
 * Zwraca {ok:true}, {ok:false, reason:'reserved'|'fixed'} albo {conflict:[ids]} (wtedy wywołaj resolve()).
 */
export function tryAssign(id,slot,code){
  id=canon(id);const a=I.get(id);if(!a)return {ok:false,reason:'unknown'};
  if(isFixed(id,slot))return {ok:false,reason:'fixed'};
  if(RESERVED.indexOf(code)>=0)return {ok:false,reason:'reserved'};
  const o=others(id,code);
  if(o.length)return {conflict:o};
  put(a,slot,code);saveKeys();return {ok:true};
}
/** Wstawia kod do slotu; jeśli drugi slot ma ten kod, zamienia sloty miejscami. */
function put(a,slot,code){
  const c=a.codes.slice();
  const j=c.indexOf(code);
  if(j>=0&&j!==slot){const prev=c[slot];c[slot]=code;if(prev===undefined)c.splice(j,1);else c[j]=prev}
  else if(slot>=c.length)c.push(code);else c[slot]=code;
  a.codes=c.filter(Boolean);
}
/** Rozstrzyga konflikt: 'swap' = zamień (druga akcja dostaje poprzedni kod tego slotu, jeśli może), 'cancel' = odrzuć. */
export function resolve(id,slot,code,mode){
  id=canon(id);const a=I.get(id);if(!a||mode!=='swap')return {ok:false,reason:'cancelled'};
  const prev=a.codes[slot];const emptied=[];
  for(const oid of others(id,code)){
    const b=I.get(oid);const idx=b.codes.indexOf(code);
    if(FIXED_FIRST[oid]&&idx===0)return {ok:false,reason:'fixed'};
    if(prev&&b.codes.indexOf(prev)<0&&I.actionsFor(prev).filter(x=>x!==id&&x!==oid).length===0)b.codes[idx]=prev;
    else b.codes.splice(idx,1);
    if(!b.codes.length)emptied.push(oid);
  }
  put(a,slot,code);saveKeys();
  return {ok:true,emptied};
}
/** Usuwa przypisanie ze slotu. */
export function clearSlot(id,slot){
  id=canon(id);const a=I.get(id);if(!a||isFixed(id,slot))return false;
  if(slot<a.codes.length){a.codes.splice(slot,1);saveKeys()}return true;
}
