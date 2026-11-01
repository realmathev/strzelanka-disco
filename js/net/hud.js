// HUD co-op: paski HP kolegów z nickami i stanem (powalony / ogłuszony), znaczniki kolegów na krawędzi ekranu (i „PODNIEŚ” przy leżącym),
// komunikaty (dołączenie, wyjście, zawołania), baner ostrzeżeń (rozłączenie, host w tle), 3 gotowe zawołania (akcje callHere/callHelp/callBoss).
// Wszystkie nazwy i teksty trafiają do DOM wyłącznie przez textContent (węzły tekstowe).
import {$} from '../core/util.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {camera} from '../render/renderer.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {h,clear} from '../ui/dom.js';
import {N,send,COLOR_CSS,colorOf,nameOf} from './session.js';

export const CALLS=['Tutaj!','Pomocy!','Uwaga, boss!'];
const CALL_ACTIONS=['callHere','callHelp','callBoss'];

const hud=$('#hud');
const team=h('div',{class:'coopTeam',id:'coopTeam',hidden:true,'aria-label':'Drużyna'});
const feedBox=h('div',{class:'coopFeed',id:'coopFeed',role:'log','aria-live':'polite'});
const banner=h('div',{class:'coopBanner',id:'coopBanner',role:'alert',hidden:true});
const marks=h('div',{class:'coopMarks',id:'coopMarks','aria-hidden':'true'});
hud.append(team,feedBox,banner,marks);

/* ---------- komunikaty ---------- */
/** Komunikat w kanale co-op (znika po ~4 s, max 5). */
export function feed(text,color){
  const el=h('div',{class:'coopFeedItem'},String(text).slice(0,80));
  if(color)el.style.borderLeftColor=color;
  feedBox.append(el);while(feedBox.children.length>5)feedBox.firstChild.remove();
  setTimeout(()=>el.remove(),4200);
}
let bannerTxt=null;
/** Baner ostrzeżenia (null = ukryj). */
export function setBanner(t){if(t===bannerTxt)return;bannerTxt=t;banner.textContent=t||'';banner.hidden=!t}

/* ---------- panel drużyny i znaczniki ---------- */
const rows=new Map();   // id -> {row, fill, state, mark, mtxt}
function rowFor(r){
  let o=rows.get(r.id);if(o)return o;
  const ci=colorOf(r.id);
  const fill=h('i',{class:'coopHpFill'}),state=h('em',{class:'coopState'}),name=h('b',{class:'coopName'},nameOf(r.id));
  const row=h('div',{class:'coopRow'},h('span',{class:'sw',style:'background:'+COLOR_CSS[ci]}),name,state,h('span',{class:'coopHp'},fill));
  const mtxt=h('span',{class:'coopMarkTxt'}),arrow=h('i',{class:'coopArrow'});
  const mark=h('div',{class:'coopMark',hidden:true,style:'--c:'+COLOR_CSS[ci]},arrow,mtxt);
  team.append(row);marks.append(mark);
  o={row,fill,state,name,mark,mtxt,arrow,last:''};rows.set(r.id,o);return o;
}
function dropRow(id){const o=rows.get(id);if(!o)return;o.row.remove();o.mark.remove();rows.delete(id)}
export function hudClear(){for(const id of [...rows.keys()])dropRow(id);team.hidden=true;setBanner(null);clear(feedBox)}

const V=new THREE.Vector3();
/** Co klatkę w runie co-op. */
export function hudUpdate(dt){
  let n=0;
  const W=innerWidth,H=innerHeight,M=44;   // znacznik ma 80 px szerokości (środek ±40)
  for(const r of N.players.values()){
    if(!r.inRun){dropRow(r.id);continue}
    n++;const o=rowFor(r);
    const f=Math.max(0,Math.min(1,r.hp/(r.mhp||100)));o.fill.style.transform='scaleX('+f.toFixed(3)+')';
    const st=r.down?'POWALONY':r.stun?'OGŁUSZONY':'';if(o.state.textContent!==st)o.state.textContent=st;
    o.row.classList.toggle('down',r.down);
    if(r.callT>0)r.callT-=dt;
    // znacznik: kolega poza ekranem (strzałka na krawędzi) albo leżący na ekranie („PODNIEŚ”); zawołanie pulsuje
    V.set(r.pos.x,r.pos.y+(r.down?.6:2.3),r.pos.z).project(camera);
    const behind=V.z>1;let x=V.x,y=V.y;if(behind){x=-x;y=-y}
    const on=!behind&&Math.abs(x)<.95&&Math.abs(y)<.95,dist=Math.round(Math.hypot(r.pos.x-P.pos.x,r.pos.z-P.pos.z));
    let txt='';
    if(r.down)txt=(on?'PODNIEŚ ['+DS.input.keyFor('use')+'] ':'LEŻY ')+dist+' m'+(r.callT>0?' · '+r.callTxt:'');   // powalenie ma pierwszeństwo
    else if(r.callT>0)txt=r.callTxt;
    else if(!on)txt=dist+' m';
    const show=!!txt;o.mark.hidden=!show;
    if(show){
      let sx,sy;
      if(on){sx=(x*.5+.5)*W;sy=(-y*.5+.5)*H}
      else{const k=Math.max(Math.abs(x),Math.abs(y))||1;sx=(x/k*.5+.5)*W;sy=(-y/k*.5+.5)*H}
      sx=Math.max(M,Math.min(W-M,sx));sy=on?Math.max(M,Math.min(H-M,sy)):Math.max(80,Math.min(H-130,sy));   // na krawędzi: z dala od pasów HUD (fala, HP, amunicja)
      o.mark.style.transform='translate('+Math.round(sx)+'px,'+Math.round(sy)+'px)';
      o.arrow.style.transform=on?'':'rotate('+Math.atan2(-y,x).toFixed(2)+'rad)';
      o.mark.classList.toggle('edge',!on);o.mark.classList.toggle('down',r.down);o.mark.classList.toggle('call',r.callT>0);
      if(o.mtxt.textContent!==txt)o.mtxt.textContent=txt;
    }
  }
  team.hidden=n===0;
}

/* ---------- zawołania ---------- */
let callCd=0;
DS.bus.on('update',dt=>{if(callCd>0)callCd-=dt});
addEventListener('keydown',e=>{
  if(e.repeat||!DS.net.active()||S.mode!=='game'||!S.G||S.G.uiPause||S.G.paused)return;
  const i=CALL_ACTIONS.findIndex(a=>DS.input.matches(a,e.code));if(i<0)return;
  if(callCd>0)return;callCd=1.2;
  send({k:'call',c:i});feed('Ty: '+CALLS[i],COLOR_CSS[colorOf(N.me)]);sfx('tick',1400);
});
DS.net.call=i=>{if(!DS.net.active()||!(i>=0&&i<3))return;send({k:'call',c:i});feed('Ty: '+CALLS[i])};

/** Podgląd HUD co-op bez sieci (tests/viewport.js): 3 przykładowych kolegów, komunikaty, baner. */
DS.net.hudDemo=on=>{
  if(!on){for(const id of ['demo1','demo2','demo3']){dropRow(id)}setBanner(null);clear(feedBox);team.hidden=true;return}
  const fake=[{id:'demo1',hp:80,mhp:100},{id:'demo2',hp:20,mhp:125,down:true},{id:'demo3',hp:55,mhp:100,stun:true}];
  fake.forEach((r,i)=>{const o=rowFor(r);o.name.textContent=['Zdzisiek','Halinka_z_Remizy','Mietek'][i];o.fill.style.transform='scaleX('+(r.hp/r.mhp)+')';
    o.state.textContent=r.down?'POWALONY':r.stun?'OGŁUSZONY':'';o.mark.hidden=false;o.mtxt.textContent=['12 m','LEŻY 30 m','Pomocy!'][i];
    o.mark.classList.add('edge');o.mark.style.transform='translate('+[44,innerWidth-44,innerWidth/2][i]+'px,'+[innerHeight/2,innerHeight/3,44][i]+'px)'});
  team.hidden=false;feed('Mietek dołącza do gry');feed('Halinka_z_Remizy: Pomocy!');setBanner('Host zminimalizował grę — wrogowie stoją');
};
