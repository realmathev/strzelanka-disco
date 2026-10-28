// Proceduralne animacje w fazach: dobycie, przeładowanie (wyjęcie -> włożenie -> zamek, wariant „na zamku” przy pustej broni),
// cykl strzału (zamek/zamek-suwadło, spust), pompka Mossberga, zamek Mosina, taśma i pokrywa PKM, bęben Pythona.
// Używa nazwanych części modeli (userData.parts / getObjectByName: slide|bolt, magazine, trigger, hammer, cylinder, pump,
// boltHandle, cover, belt, ejectionPort). Czas przeładowania = W.reload z danych (balans), tu tylko podział na fazy.
// Wynik: AN.pos/AN.rot (przesunięcie całej broni) + pozycje/obroty części względem spoczynku (userData.p0).
import {GLOBAL} from './tuning.js';
import {clamp01,smooth,seg,win,kickCurve,backOut} from './math.js';

const GL=GLOBAL;
export const AN={pos:new THREE.Vector3(),rot:new THREE.Vector3()};
let M=null; // bieżący model: {model, p:{nazwa:Object3D}, r0:{nazwa:Euler}, cfg}
const st={draw:1,drawDur:.4,reload:false,rp:0,rprev:0,rdur:1,empty:false,ammo0:0,mag:1,cyc:9,lock:false,
  pump:-1,bolt:-1,cyl:0,cylFrom:0,cylT:9,hidden:false};
let hooks={sound(){},eject(){}};
/** sound(kind) -> audio/gunsfx gunMech; eject(n) -> wyrzut n łusek z ejectionPort. */
export function animHooks(h){hooks=h}

const NAMES=['slide','bolt','magazine','trigger','hammer','cylinder','cylinderSwing','pump','boltHandle','cover','belt','beltBox','scope'];
/** Nowy model broni (po buildGun). */
export function animModel(model,cfg,W){
  const parts=model&&model.userData&&model.userData.parts||{};const p={},r0={};
  for(const n of NAMES){const o=parts[n]||(model&&model.getObjectByName(n));if(o&&o.isObject3D){p[n]=o;if(!o.userData.p0)o.userData.p0=o.position.clone();r0[n]=o.rotation.clone()}}
  M={model,p,r0,cfg,cyc:p.slide||p.bolt||null};
  st.draw=0;st.drawDur=cfg.draw||.4;st.reload=false;st.cyc=9;st.lock=false;st.pump=-1;st.bolt=-1;st.cyl=0;st.cylT=9;st.hidden=false;st.mag=W&&W.mag||1;
  hooks.sound('draw');
}
export function animClear(){M=null;st.reload=false;AN.pos.set(0,0,0);AN.rot.set(0,0,0)}
/** Strzał: start cyklu. ammo = naboje po strzale. */
export function animShot(ammo){
  if(!M)return;st.cyc=0;const a=M.cfg.action;
  if(a==='pistol'&&ammo<=0)st.lock=true;
  if(a==='pump'&&ammo>0)st.pump=-.14;   // pompka po krótkiej chwili (odrzut najpierw)
  if(a==='bolt'&&ammo>0)st.bolt=-.2;
  if(a==='revolver'){st.cylFrom=st.cyl;st.cyl-=Math.PI/3;st.cylT=0}
}
export const reloading=()=>st.reload;
export const drawing=()=>st.draw<1;

const R0=new THREE.Euler();
function P(n,x,y,z){const o=M.p[n];if(!o)return;const r=o.userData.p0;o.position.set(r.x+x,r.y+y,r.z+z)}
function Rt(n,x,y,z){const o=M.p[n];if(!o)return;const r=M.r0[n]||R0;o.rotation.set(r.x+x,r.y+y,r.z+z)}
const cross=(a,b,x)=>a<x&&b>=x;
function ev(x,kind){if(cross(st.rprev,st.rp,x))hooks.sound(kind)}

/** Klatka animacji. G: stan runu, W: definicja broni. */
export function animUpdate(dt,G,W){
  AN.pos.set(0,0,0);AN.rot.set(0,0,0);if(!M)return;
  const c=M.cfg,a=c.action,cy=c.cycle,D=GL.draw,RL=GL.reload;
  /* — dobycie — */
  if(st.draw<1){st.draw=Math.min(1,st.draw+dt/st.drawDur);const e=1-backOut(st.draw,1.1);
    AN.pos.x+=D.x*e;AN.pos.y+=D.y*e;AN.rot.x+=D.rotX*e;AN.rot.z+=D.rotZ*e}
  /* — przeładowanie: wykrycie startu/końca po G.reloadT (ustawia weapons/fire.js) — */
  const ammo=G.ammo[G.weapon];
  if(G.reloadT>0&&!st.reload){st.reload=true;st.rdur=Math.max(.3,W.reload||1);st.empty=ammo<=0;st.ammo0=ammo;st.rp=st.rprev=clamp01(1-G.reloadT/st.rdur);st.pump=-1;st.bolt=-1}
  else if(G.reloadT<=0&&st.reload){st.reload=false;st.lock=false;st.rp=st.rprev=0}
  // reset części do spoczynku (każda klatka nadpisuje od zera)
  for(const n in M.p){const o=M.p[n];o.position.copy(o.userData.p0);const r=M.r0[n];o.rotation.copy(r)}
  if(st.hidden&&M.p.magazine){M.p.magazine.visible=true;if(M.p.beltBox)M.p.beltBox.visible=true;st.hidden=false}
  /* — cykl strzału — */
  st.cyc+=dt;
  const back=cy.travel*kickCurve(st.cyc,cy.back,cy.ret);
  if(M.cyc&&a!=='bolt'&&a!=='belt')P(M.cyc===M.p.slide?'slide':'bolt',0,0,st.lock?cy.travel:back);
  if(M.p.trigger)Rt('trigger',-cy.trig*kickCurve(st.cyc,.012,.09),0,0);
  if(M.p.hammer&&a!=='revolver')Rt('hammer',-.5*kickCurve(st.cyc,.008,.06),0,0);   // kurek odbity przez zamek
  if(a==='belt'&&M.p.belt)P('belt',0,.004*kickCurve(st.cyc,.01,.06),0);
  if(a==='revolver'){st.cylT+=dt;const k=smooth(st.cylT/.12);if(M.p.cylinder)Rt('cylinder',0,0,st.cylFrom+(st.cyl-st.cylFrom)*k);
    if(M.p.hammer)Rt('hammer',.6*(1-smooth(st.cyc/.03))*(st.cyc<.03?1:0),0,0)}
  if(a==='pump'&&st.pump>-1&&!st.reload){st.pump+=dt;const t=st.pump;
    if(t>=0){const k=seg(t,0,.12)-seg(t,.16,.28);P('pump',0,0,.075*k);AN.rot.x-=.05*k;AN.pos.z+=.012*k;AN.rot.z-=.06*k;
      if(cross(t-dt,t,0))hooks.sound('pumpBack');if(cross(t-dt,t,.11))hooks.eject(1);if(cross(t-dt,t,.16))hooks.sound('pumpFwd');if(t>.3)st.pump=-1}}
  if(a==='bolt'&&st.bolt>-1&&!st.reload){st.bolt+=dt;const t=st.bolt/1.15;
    if(t>=0){const up=seg(t,0,.1)-seg(t,.44,.52),bk=seg(t,.1,.22)-seg(t,.3,.42);Rt('boltHandle',0,0,1.5*up);P('bolt',0,0,.11*bk);
      const w=win(t,0,.1,.45,.6);AN.rot.z+=.22*w;AN.pos.y-=.015*w;AN.rot.x+=.03*w;
      if(cross(t-dt/1.15,t,0))hooks.sound('boltUp');if(cross(t-dt/1.15,t,.1))hooks.sound('boltBack');if(cross(t-dt/1.15,t,.2))hooks.eject(1);
      if(cross(t-dt/1.15,t,.3))hooks.sound('boltFwd');if(cross(t-dt/1.15,t,.44))hooks.sound('boltDown');if(t>.62)st.bolt=-1}}
  /* — fazy przeładowania — */
  if(st.reload){st.rprev=st.rp;st.rp=clamp01(1-G.reloadT/st.rdur);reloadPose(a,st.rp,RL)}
}

function pose(a,k){const q=GL.reload.pose[a]||GL.reload.pose.mag;AN.pos.x+=q.pos[0]*k;AN.pos.y+=q.pos[1]*k;AN.pos.z+=q.pos[2]*k;AN.rot.x+=q.rot[0]*k;AN.rot.y+=q.rot[1]*k;AN.rot.z+=q.rot[2]*k}
function hide(n,on){const o=M.p[n];if(o&&on){o.visible=false;st.hidden=true}}
function reloadPose(a,p,RL){
  const tilt=win(p,0,.14,.84,1);
  if(a==='none'){const s=Math.sin(p*Math.PI);AN.pos.y-=.12*s;AN.rot.x-=.8*s;AN.rot.z+=.4*s;ev(.2,'magOut');ev(.62,'magIn');if(st.empty)ev(.8,'boltFwd');return}
  if(a==='mag'||a==='pistol'){
    const small=a==='pistol',drop=RL.magDrop*(small?.7:1);
    pose(a,tilt);
    const out=seg(p,.14,.3),inn=seg(p,.42,.6),m=out*(1-inn);
    P('magazine',0,-drop*m,RL.magFwd*m*(small?0:1));hide('magazine',p>.31&&p<.42);
    const seat=win(p,.58,.6,.62,.68);AN.rot.x+=.06*seat;AN.pos.y+=.008*seat;
    ev(.15,'magOut');ev(.59,'magIn');
    if(st.empty){
      if(small){P('slide',0,0,M.cfg.cycle.travel*(1-seg(p,.74,.77)));ev(.74,'slideRel');}
      else{const b=seg(p,.68,.74)*(1-seg(p,.78,.8));if(M.cyc)P(M.cyc===M.p.slide?'slide':'bolt',0,0,(M.cfg.cycle.travel*2.2)*b);ev(.68,'boltBack');ev(.78,'boltFwd')}
      const turn=win(p,.64,.7,.8,.86);AN.rot.y+=.22*turn;AN.rot.z-=.15*turn;
    }else{const tap=win(p,.66,.68,.7,.76);AN.rot.x+=.04*tap}
    return}
  if(a==='revolver'){
    pose(a,tilt);
    const sw=seg(p,.1,.18)*(1-seg(p,.76,.84));Rt('cylinderSwing',0,0,1.35*sw);if(M.p.cylinderSwing&&!M.p.magazine)Rt('magazine',0,0,1.35*sw);
    const up=win(p,.2,.27,.34,.42);AN.rot.x+=.75*up;AN.pos.y+=.03*up;
    if(M.p.cylinder){const k=Math.floor(clamp01((p-.46)/.28)*5);Rt('cylinder',0,0,st.cyl-k*Math.PI/3)}
    ev(.1,'cylOut');ev(.3,'magOut');if(cross(st.rprev,p,.3))hooks.eject(Math.max(1,st.mag-st.ammo0));
    for(const x of [.5,.56,.62,.68,.74])ev(x,'cylClick');ev(.82,'cylIn');
    return}
  if(a==='pump'){
    pose(a,tilt);
    const n=Math.max(1,Math.min(st.mag,st.mag-st.ammo0)),a0=.12,a1=.8,L=(a1-a0)/n;
    if(p>a0&&p<a1){const i=Math.floor((p-a0)/L),u=(p-a0-i*L)/L;P('magazine',0,-.07*(1-seg(u,.15,.7)),.02*(1-seg(u,.15,.7)));
      const push=win(u,.4,.6,.7,.95);AN.rot.x+=.03*push;AN.pos.z-=.006*push;}
    for(let i=0;i<n;i++)ev(a0+(i+.62)*L,'shellIn');
    if(st.empty){const k=seg(p,.82,.87)-seg(p,.89,.94);P('pump',0,0,.075*k);AN.rot.x-=.05*k;ev(.82,'pumpBack');ev(.89,'pumpFwd')}
    return}
  if(a==='bolt'){
    pose(a,tilt);
    const up=seg(p,.06,.14)-seg(p,.8,.86),bk=seg(p,.14,.22)-seg(p,.72,.8);Rt('boltHandle',0,0,1.5*up);P('bolt',0,0,.11*bk);
    ev(.06,'boltUp');ev(.14,'boltBack');if(st.empty&&cross(st.rprev,p,.2))hooks.eject(1);
    const n=Math.max(1,Math.min(5,st.mag-st.ammo0));for(let i=0;i<n;i++){const x=.3+i*(.38/n);ev(x,'shellIn');const w=win(p,x-.03,x,x+.01,x+.06);AN.rot.x-=.035*w;AN.pos.y-=.006*w}
    ev(.72,'boltFwd');ev(.8,'boltDown');
    return}
  if(a==='belt'){
    pose(a,tilt);
    const cov=seg(p,.08,.16)*(1-seg(p,.7,.76));Rt('cover',1.1*cov,0,0);
    const out=seg(p,.18,.34),inn=seg(p,.42,.58),m=out*(1-inn);P('beltBox',-.02*m,-.26*m,0);hide('beltBox',p>.35&&p<.42);
    P('belt',0,.012*win(p,.6,.64,.66,.7),0);
    const ch=seg(p,.8,.84)*(1-seg(p,.86,.88));if(M.p.bolt)P('bolt',0,0,.075*ch);
    ev(.08,'coverOpen');ev(.18,'magOut');ev(.56,'magIn');ev(.6,'beltIn');ev(.74,'coverClose');ev(.8,'boltBack');ev(.86,'boltFwd');
    return}
}
