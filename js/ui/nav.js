// Nawigacja po menu klawiaturą (strzałki, Tab, Enter, Esc = wstecz) i padem (D-pad/lewy drążek, A, B, Start).
// Nawigacja przestrzenna: strzałka wybiera najbliższy element w danym kierunku.
import {$$} from '../core/util.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';

const FOCUSABLE='button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
let backFn=null,startFn=null;
/** Rejestruje obsługę „wstecz” (Esc / B) i „start” (pad: pauza w grze). */
export function initNav(opts){backFn=opts.back;startFn=opts.start}

export const activeScreen=()=>$$('.screen').find(s=>!s.hidden)||null;
const shown=el=>{if(el.closest('[hidden]'))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
export const focusables=root=>[...root.querySelectorAll(FOCUSABLE)].filter(shown);
const gameplay=()=>{const G=S.G;return S.mode==='game'&&!!G&&!G.paused&&!G.dead};
const setKb=on=>document.documentElement.classList.toggle('kbnav',on);

/** Ustawia fokus na pierwszym (lub oznaczonym data-autofocus) elemencie ekranu. */
export function focusInitial(screen){
  if(!screen)return;
  const a=document.activeElement;if(a&&a!==document.body&&screen.contains(a)&&shown(a))return;
  const el=screen.querySelector('[data-autofocus]:not([disabled])')||focusables(screen)[0];
  if(el)el.focus({preventScroll:true});
}

function move(dx,dy){
  const root=activeScreen();if(!root)return false;
  const cur=document.activeElement;
  if(!cur||cur===document.body||!root.contains(cur)){focusInitial(root);return true}
  const list=focusables(root),cr=cur.getBoundingClientRect(),cx=cr.left+cr.width/2,cy=cr.top+cr.height/2;
  let best=null,bs=Infinity;
  for(const el of list){
    if(el===cur)continue;
    const r=el.getBoundingClientRect(),vx=r.left+r.width/2-cx,vy=r.top+r.height/2-cy;
    const along=dx?vx*dx:vy*dy;if(along<=2)continue;
    const across=Math.abs(dx?vy:vx);
    // bonus za nakładanie się w osi poprzecznej (elementy w jednej kolumnie/wierszu)
    const overlap=dx?Math.min(r.bottom,cr.bottom)-Math.max(r.top,cr.top):Math.min(r.right,cr.right)-Math.max(r.left,cr.left);
    const s=along+across*(overlap>0?1.2:3);
    if(s<bs){bs=s;best=el}
  }
  if(!best)return false;
  best.focus({preventScroll:true});best.scrollIntoView({block:'nearest',inline:'nearest'});return true;
}
function stepRange(el,dir){
  const step=+el.step||1,min=+el.min,max=+el.max;
  el.value=String(Math.min(max,Math.max(min,+el.value+dir*step)));
  el.dispatchEvent(new Event('input',{bubbles:true}));
}

addEventListener('keydown',e=>{
  if(DS.input.capturing())return;
  if(gameplay())return;
  const scr=activeScreen();if(!scr)return;
  const t=e.target,k=e.key;
  if(k==='Escape'){if(backFn&&backFn()){e.preventDefault();e.stopImmediatePropagation()}return}
  const dir={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[k];
  if(dir){
    setKb(true);
    if(t&&t.type==='range'&&dir[0])return;                    // lewo/prawo na suwaku zmienia wartość natywnie
    if(move(dir[0],dir[1]))e.preventDefault();
  }else if(k==='Tab')setKb(true);
},true);
addEventListener('pointerdown',()=>setKb(false),true);

/* ---- pad ---- */
let pad=false,prev={},holdT={},raf=0;
const DEAD=.55;
function poll(t){
  raf=requestAnimationFrame(poll);
  const gp=(navigator.getGamepads?navigator.getGamepads():[]);let p=null;for(const g of gp)if(g&&g.connected){p=g;break}
  if(!p)return;
  const b=i=>!!(p.buttons[i]&&p.buttons[i].pressed);
  const st={up:b(12)||p.axes[1]<-DEAD,down:b(13)||p.axes[1]>DEAD,left:b(14)||p.axes[0]<-DEAD,right:b(15)||p.axes[0]>DEAD,a:b(0),b:b(1),start:b(9)};
  const edge=k=>st[k]&&!prev[k];
  const rep=k=>{if(!st[k]){holdT[k]=0;return false}if(!prev[k]){holdT[k]=t+380;return true}if(t>=holdT[k]){holdT[k]=t+130;return true}return false};
  if(gameplay()){if(edge('start')&&startFn)startFn();prev=st;return}
  if(!activeScreen()){prev=st;return}
  const el=document.activeElement;
  const dirs=[['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]];
  for(const [k,dx,dy] of dirs)if(rep(k)){
    setKb(true);
    if(dx&&el&&el.type==='range')stepRange(el,dx);else move(dx,dy);
  }
  if(edge('a')&&el&&el!==document.body){setKb(true);el.click()}
  if(edge('b')||edge('start')){setKb(true);if(backFn)backFn()}
  prev=st;
}
function startPad(){if(!pad){pad=true;raf=requestAnimationFrame(poll)}}
addEventListener('gamepadconnected',startPad);
if(navigator.getGamepads&&[...navigator.getGamepads()].some(g=>g))startPad();
