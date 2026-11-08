// Języki gry: angielski (domyślny na JuicyJuicy) i polski (oryginał).
// Użycie w kodzie: L('Polski tekst','English text') — zwraca tekst w bieżącym języku.
// Język jest ustalany RAZ przy starcie (rejestry broni, perków, poziomów budują teksty przy imporcie),
// więc zmiana języka zapisuje wybór i przeładowuje stronę: setLang('pl').
// Wybór gracza: opt.lang w discoStrzelnica.opt.v1 (czytany tu bezpośrednio, bo save.js importuje ten moduł później).
import {store} from './util.js';

export const LANGS=['en','pl'];
const saved=(store.get('discoStrzelnica.opt.v1',{})||{}).lang;
// Bez zapisanego wyboru: polska przeglądarka dostaje polski, reszta angielski.
const guess=(()=>{try{return /^pl\b/i.test(navigator.language||'')?'pl':'en'}catch(e){return 'en'}})();
export const lang=LANGS.includes(saved)?saved:guess;
document.documentElement.lang=lang;

/** Tekst w bieżącym języku. Brak angielskiej wersji = polski (żeby nic nie znikało). */
export function L(pl,en){return lang==='en'&&en!=null?en:pl}
/** Liczba mnoga: L.n(n,{pl:['klucz','klucze','kluczy'],en:['key','keys']}). */
L.n=(n,{pl,en})=>{
  if(lang==='en')return n===1?en[0]:en[1];
  const a=Math.abs(n),d=a%10,dd=a%100;
  return a===1?pl[0]:(d>=2&&d<=4&&!(dd>=12&&dd<=14))?pl[1]:pl[2];
};
/** Zapisuje wybór języka i przeładowuje grę. */
export function setLang(code){
  if(!LANGS.includes(code)||code===lang)return;
  const o=store.get('discoStrzelnica.opt.v1',{})||{};o.lang=code;store.set('discoStrzelnica.opt.v1',o);
  location.reload();
}
