// Celownik: znacznik DOM + zastosowanie opcji (styl, kolor, rozmiar, kropka). Używany w HUD i w podglądzie opcji.
import {opt} from '../core/save.js';
import {h} from './dom.js';

export const XH_STYLES=[['cross','Krzyż'],['gap','Krzyż z przerwą'],['dot','Kropka'],['circle','Okrąg'],['brackets','Narożniki'],['none','Brak']];
export const XH_COLORS=[['#fff8e6','Biały'],['#f7c51e','Żółty'],['#ff4a3d','Czerwony'],['#43f0a0','Zielony'],['#3ad7ff','Cyjan'],['#ff4fd8','Magenta']];

/** Tworzy element celownika. */
export function makeCrosshair(id){
  return h('div',{class:'xh',id,'aria-hidden':'true'},
    h('i',{class:'xa'}),h('i',{class:'xb'}),h('i',{class:'xc'}),h('i',{class:'xd'}),h('i',{class:'xr'}),h('i',{class:'xp'}),
    h('i',{class:'xm xm1'}),h('i',{class:'xm xm2'}),h('i',{class:'xm xm3'}),h('i',{class:'xm xm4'}));
}
/** Stosuje opcje celownika do elementu. */
export function applyCrosshair(el){
  if(!el)return;
  el.dataset.style=opt.xhStyle;el.dataset.dot=String(opt.xhDot?1:0);
  el.style.setProperty('--xh-c',opt.xhColor);el.style.setProperty('--xh-s',opt.xhSize+'px');
}
