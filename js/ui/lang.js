// Przełącznik języka „EN | PL” (menu główne i Opcje → Gra). Zmiana zapisuje wybór i przeładowuje stronę (setLang).
import {lang,setLang,L} from '../core/i18n.js';
import {h} from './dom.js';

/** Mały przełącznik EN | PL. Aktywny język ma aria-pressed=true. */
export function langSwitch(cls){
  const b=(code,name)=>h('button',{type:'button',class:'langBtn',lang:code,'data-lang':code,'aria-pressed':String(code===lang),
    'aria-label':name,title:name,onclick:()=>setLang(code)},code.toUpperCase());
  return h('div',{class:'langSw'+(cls?' '+cls:''),role:'group','aria-label':L('Język','Language')},
    b('en','English'),h('span',{class:'langSep','aria-hidden':'true'},'|'),b('pl','Polski'));
}
