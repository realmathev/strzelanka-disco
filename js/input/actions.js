// Domyślne akcje i przypisania (właściciel: ds-input-menus).
// Akcja 'use' (E) jest zdefiniowana TYLKO tu (pickups/machines.js czyta ją przez DS.input).
// Id akcji są camelCase (zgodnie z istniejącym kodem gry); aliasy snake_case (move_fwd, weapon_1,
// weapon_next, perk_menu, heal...) działają we wszystkich metodach DS.input (get/has/isDown/matches/bind/reset).
// Zapis przypisań: opt.keys (localStorage `discoStrzelnica.opt.v1`, bez zmiany klucza).
import {DS} from '../core/ds.js';
import {opt,persistOpt} from '../core/save.js';
import './optdefs.js';
import {codeLabel} from './labels.js';
import {SLOT_NAMES,SLOT_COUNT} from '../weapons/slots.js';

const I=DS.input;

export const GROUPS=[
  {id:'move',label:'Ruch'},
  {id:'combat',label:'Walka'},
  {id:'weapons',label:'Wybór broni'},
  {id:'misc',label:'Pozostałe'},
];
/** Kody, których nie wolno przypisać (Esc = anulowanie/pauza, klawisze systemowe przeglądarki). */
export const RESERVED=['Escape','F1','F5','F11','F12','MetaLeft','MetaRight','ContextMenu'];
/** Akcje z zablokowanym pierwszym slotem (nie da się go zmienić). */
export const FIXED_FIRST={pause:'Escape'};

const A=[
  {id:'moveForward',label:'Do przodu',group:'move',codes:['KeyW','ArrowUp']},
  {id:'moveBack',label:'Do tyłu',group:'move',codes:['KeyS','ArrowDown']},
  {id:'moveLeft',label:'W lewo',group:'move',codes:['KeyA','ArrowLeft']},
  {id:'moveRight',label:'W prawo',group:'move',codes:['KeyD','ArrowRight']},
  {id:'sprint',label:'Sprint',group:'move',codes:['ShiftLeft','ShiftRight'],mode:'sprintMode'},
  {id:'jump',label:'Skok',group:'move',codes:['Space']},
  {id:'crouch',label:'Kucanie',group:'move',codes:['ControlLeft','KeyC'],mode:'crouchMode'},
  {id:'fire',label:'Strzał',group:'combat',codes:['Mouse0']},
  {id:'ads',label:'Celowanie (ADS)',group:'combat',codes:['Mouse2'],mode:'adsMode'},
  {id:'reload',label:'Przeładuj',group:'combat',codes:['KeyR']},
  {id:'melee',label:'Cios wręcz',group:'combat',codes:['KeyV']},
  {id:'weaponNext',label:'Następna broń',group:'combat',codes:['WheelDown']},
  {id:'weaponPrev',label:'Poprzednia broń',group:'combat',codes:['WheelUp']},
];
// Klawisze 1-6 = SLOT broni (pistolety, PM, strzelby, karabiny, wyborowe, LKM); ponowne naciśnięcie przełącza w obrębie slotu.
for(let i=1;i<=SLOT_COUNT;i++)A.push({id:'weapon'+i,label:'Slot '+i+': '+SLOT_NAMES[i-1],group:'weapons',codes:['Digit'+i]});
A.push(
  {id:'use',label:'Użyj / interakcja',group:'misc',codes:['KeyE']},
  {id:'medkit',label:'Apteczka (leczenie)',group:'misc',codes:['KeyH']},
  {id:'perkMenu',label:'Menu perków',group:'misc',codes:['Tab']},
  {id:'pause',label:'Pauza',group:'misc',codes:['Escape','KeyP']},
);
A.forEach(a=>I.register(a));

/* ---- aliasy nazw ---- */
const ALIAS={move_fwd:'moveForward',move_forward:'moveForward',move_back:'moveBack',move_left:'moveLeft',move_right:'moveRight',
  heal:'medkit',weapon_next:'weaponNext',weapon_prev:'weaponPrev',perk_menu:'perkMenu'};
for(let i=1;i<=SLOT_COUNT;i++)ALIAS['weapon_'+i]='weapon'+i;
/** Id kanoniczny (zamienia alias na właściwy id). */
export const canon=id=>ALIAS[id]||id;
const get0=I.get,has0=I.has,bind0=I.bind,reset0=I.reset;
I.get=id=>get0(canon(id));
I.has=id=>has0(canon(id));

/* ---- zapis i odczyt przypisań ---- */
function sanitize(id,codes){
  if(!Array.isArray(codes))return null;
  const out=[];
  for(const c of codes){if(typeof c==='string'&&c&&c.length<24&&out.indexOf(c)<0&&(c==='Escape'?id==='pause':RESERVED.indexOf(c)<0))out.push(c);if(out.length>=3)break}
  const fx=FIXED_FIRST[id];if(fx&&out[0]!==fx){const i=out.indexOf(fx);if(i>=0)out.splice(i,1);out.unshift(fx)}
  return out;
}
/** Zapisuje bieżące przypisania w opcjach. */
export function saveKeys(){opt.keys=I.serialize();persistOpt();DS.bus.emit('keys',opt.keys)}
/** Czy przypisania różnią się od domyślnych. */
export function isModified(id){const a=get0(canon(id));return !!a&&(a.codes.length!==a.defaults.length||a.codes.some((c,i)=>c!==a.defaults[i]))}
I.bind=(id,codes)=>{const a=get0(canon(id));if(!a)return;const s=sanitize(a.id,codes);if(s)a.codes=s;saveKeys()};
I.reset=id=>{if(id){const a=get0(canon(id));if(a)a.codes=a.defaults.slice()}else reset0();saveKeys()};
if(opt.keys&&typeof opt.keys==='object'){for(const id in opt.keys){const a=get0(id);const s=a&&sanitize(id,opt.keys[id]);if(s)a.codes=s}}

/* ---- pomocnicze (dla UI i innych domen) ---- */
Object.assign(I,{
  groups:GROUPS,reserved:RESERVED,codeLabel,isModified,
  /** Etykieta klawiszy akcji, np. „W / Strzałka w górę”. */
  labelFor(id){const a=I.get(id);return a&&a.codes.length?a.codes.map(codeLabel).join(' / '):'—'},
  /** Pierwszy klawisz akcji (krótka etykieta do HUD). */
  keyFor(id){const a=I.get(id);return a&&a.codes.length?codeLabel(a.codes[0]):'—'},
});
