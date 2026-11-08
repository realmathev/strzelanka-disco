// Celownik: znacznik DOM + zastosowanie opcji (styl, kolor, rozmiar, kropka). Używany w HUD i w podglądzie opcji.
import {opt} from '../core/save.js';
import {h} from './dom.js';
import {L} from '../core/i18n.js';

export const XH_STYLES=[['cross',L('Krzyż','Cross')],['gap',L('Krzyż z przerwą','Cross with gap')],['dot',L('Kropka','Dot')],['circle',L('Okrąg','Circle')],['brackets',L('Narożniki','Corners')],['none',L('Brak','None')]];
export const XH_COLORS=[['#fff8e6',L('Biały','White')],['#f7c51e',L('Żółty','Yellow')],['#ff4a3d',L('Czerwony','Red')],['#43f0a0',L('Zielony','Green')],['#3ad7ff',L('Cyjan','Cyan')],['#ff4fd8','Magenta']];

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
