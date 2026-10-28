// Nakładka 2D gunfeel: siatka lunety (reticles.js modelarza, rysowana raz do bufora), znacznik zabicia i headshota,
// przygaszanie celownika HUD w ADS oraz hit-stop przy zabiciu (zamrożenie czasu gry na ≤ 40 ms przez zegar pętli).
// Zwykłe trafienie pokazuje celownik HUD (ui/hud.js, opcja xhHit); stary znacznik z render/comicfx (G.hitT) jest tłumiony,
// żeby nie było dwóch naraz.
import {opt} from '../core/save.js';
import {GLOBAL} from './tuning.js';
import {easeOut} from './math.js';

const H=GLOBAL.hit;
let cv=null,ctx=null,W=0,Hh=0,dpr=1,dirty=false;
let reticleFn=null;import('../weapons/models/reticles.js').then(m=>{reticleFn=m.drawReticle}).catch(()=>{});
const scopeBuf={c:null,kind:'',w:0,h:0};

function ensure(){
  if(cv)return true;const fx=document.getElementById('fx');if(!fx)return false;
  cv=document.createElement('canvas');cv.id='gfOverlay';cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  fx.after(cv);ctx=cv.getContext('2d');return true;
}
function size(){const d=Math.min(devicePixelRatio||1,2),w=cv.clientWidth,h=cv.clientHeight;
  if(w!==W||h!==Hh||d!==dpr||cv.width!==Math.round(w*d)){W=w;Hh=h;dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(h*d)}}

/* ───────── znaczniki ───────── */
const marks=[];for(let i=0;i<6;i++)marks.push({on:false,t:0,life:.3,kind:'kill',head:false});
/** kind: 'kill' | 'head' (headshot bez zabicia). */
export function marker(kind,head){if(!+opt.xhHit&&opt.xhHit!==undefined)return;let m=marks.find(x=>!x.on)||marks[0];
  m.on=true;m.t=0;m.kind=kind;m.head=!!head;m.life=kind==='kill'?H.killMarker:H.headRing}
function drawMarks(dt){
  let any=false;const cx=W/2,cy=Hh/2,s0=H.markerSize,g=H.markerGap;
  for(const m of marks){if(!m.on)continue;m.t+=dt;const u=m.t/m.life;if(u>=1){m.on=false;continue}any=true;
    const a=u<.7?1:1-(u-.7)/.3;ctx.globalAlpha=a;ctx.lineCap='round';
    if(m.kind==='kill'){const pop=1+.35*(1-easeOut(Math.min(1,u*4))),r0=g*pop,r1=(g+s0*1.35)*pop;
      ctx.lineWidth=7;ctx.strokeStyle='#15110e';ctx.beginPath();for(const [x,y] of DIAG){ctx.moveTo(cx+x*r0,cy+y*r0);ctx.lineTo(cx+x*r1,cy+y*r1)}ctx.stroke();
      ctx.lineWidth=3.5;ctx.strokeStyle=m.head?'#ff3b30':'#ffe14a';ctx.beginPath();for(const [x,y] of DIAG){ctx.moveTo(cx+x*r0,cy+y*r0);ctx.lineTo(cx+x*r1,cy+y*r1)}ctx.stroke();
      if(m.head){ctx.lineWidth=3;ctx.strokeStyle='#15110e';ctx.beginPath();ctx.arc(cx,cy,r1+6+u*10,0,7);ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle='#ff3b30';ctx.stroke()}}
    else{const r=g+s0*.6+u*16;ctx.lineWidth=4;ctx.strokeStyle='#15110e';ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#ff4a3d';ctx.stroke()}}
  ctx.globalAlpha=1;return any;
}
const DIAG=[[.7071,.7071],[.7071,-.7071],[-.7071,.7071],[-.7071,-.7071]];

/* ───────── luneta ───────── */
function scopeImage(kind){
  if(!reticleFn)return null;const w=cv.width,h=cv.height;
  if(scopeBuf.c&&scopeBuf.kind===kind&&scopeBuf.w===w&&scopeBuf.h===h)return scopeBuf.c;
  const c=scopeBuf.c||document.createElement('canvas');c.width=w;c.height=h;if(!reticleFn(kind,c.getContext('2d'),w,h))return null;
  scopeBuf.c=c;scopeBuf.kind=kind;scopeBuf.w=w;scopeBuf.h=h;return c;
}

/* ───────── celownik HUD ───────── */
let xh=null,xhOp=-1;
function crosshair(op){if(!xh)xh=document.getElementById('xhair');if(!xh)return;op=Math.round(op*20)/20;if(op!==xhOp){xhOp=op;xh.style.opacity=op>=1?'':String(op)}}

/** Rysuje nakładkę. scope: {kind, a (0..1)} albo null; xhOpacity: 0..1. */
export function drawOverlay(dt,scope,xhOpacity){
  crosshair(xhOpacity);
  if(!ensure())return;const need=(scope&&scope.a>0)||marks.some(m=>m.on);
  if(!need){if(dirty){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);dirty=false}return}
  size();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);dirty=true;
  if(scope&&scope.a>0){const img=scopeImage(scope.kind);if(img){ctx.globalAlpha=scope.a;
      // lekkie „wjechanie” lunety: obraz skaluje się z 1,25 do 1 i przesuwa o oddech/sway
      const k=1+.25*(1-scope.a),w=cv.width*k,h=cv.height*k;ctx.drawImage(img,(cv.width-w)/2+scope.dx*dpr,(cv.height-h)/2+scope.dy*dpr,w,h);
      if(k>1){ctx.fillStyle='#000';const x0=(cv.width-w)/2+scope.dx*dpr,y0=(cv.height-h)/2+scope.dy*dpr;
        ctx.fillRect(0,0,cv.width,Math.max(0,y0));ctx.fillRect(0,y0+h,cv.width,cv.height);ctx.fillRect(0,0,Math.max(0,x0),cv.height);ctx.fillRect(x0+w,0,cv.width,cv.height)}
      ctx.globalAlpha=1}}
  ctx.setTransform(dpr,0,0,dpr,0,0);drawMarks(dt);
}
export function clearOverlay(){for(const m of marks)m.on=false;crosshair(1);if(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);dirty=false}}

/* ───────── hit-stop ───────── */
let stopUntil=0,wrapped=false;
/** Owija zegar pętli gry (game/loop.js: clock): w trakcie hit-stopu getDelta() zwraca 0, czyli świat stoi, a render idzie dalej. */
function wrapClock(){if(wrapped)return;wrapped=true;
  import('../game/loop.js').then(m=>{const c=m.clock;if(!c||c.__gfStop)return;const gd=c.getDelta.bind(c);
    c.getDelta=function(){const d=gd();return performance.now()<stopUntil?0:d};c.__gfStop=true}).catch(()=>{wrapped=false})}
wrapClock();
/** Zamraża czas gry na `ms` (≤ 40). */
export function hitStop(ms){ms=Math.min(40,Math.max(0,ms));if(ms<=0)return;stopUntil=Math.max(stopUntil,performance.now()+ms)}
export const hitStopActive=()=>performance.now()<stopUntil;
