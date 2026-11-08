// Znajdźki wypadające z wrogów: monety, klucze, apteczki. Typy w DS.pickups.
import {rand} from '../core/util.js';
import {save} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {scene} from '../render/renderer.js';
import {toon,hull,disposeObject} from '../render/materials.js';
import {addFloater,announce} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {P} from '../player/player.js';
import {L} from '../core/i18n.js';

/** Czas życia znajdźki [s]; przez ostatnie BLINK_T sekund pulsuje skalą (nigdy visible=false). */
const LIFE=25,BLINK_T=4;
/** Maks. liczba znajdziek na scenie; przy przekroczeniu znika najstarsza (monety/klucze trafiają od razu do gracza). */
const MAX_PICKUPS=30;

// Geometrie i materiały znajdziek są współdzielone (flaga `shared`: disposeObject ich nie zwalnia).
const shared=o=>(o.userData.shared=true,o);
const coinGeo=shared(new THREE.CylinderGeometry(.22,.22,.06,14)),keyGeo=shared(new THREE.BoxGeometry(.2,.5,.1)),
  medGeo=shared(new THREE.BoxGeometry(.5,.35,.35)),medC1=shared(new THREE.BoxGeometry(.52,.1,.3)),medC2=shared(new THREE.BoxGeometry(.52,.28,.1));
const coinMat=shared(toon(0xffcc33,{emissive:0x332200})),keyMat=shared(toon(0x43c7ff,{emissive:0x05202a})),medMat=shared(toon(0xf4efe4)),medRed=shared(toon(0xd3242a));

// Definicja: {id, magnet: zasięg przyciągania [m], mesh(): Mesh, collect(p): efekt podniesienia}.
DS.pickups.register({id:'coin',magnet:6,
  mesh(){const m=new THREE.Mesh(coinGeo,coinMat);m.rotation.x=Math.PI/2;return m},
  spin(m,dt){m.rotation.z+=dt*5},
  collect(p){const G=S.G;save.coins+=p.val;G.earned+=p.val;sfx('coin');addFloater('+'+p.val,{x:innerWidth-110+rand(-20,20),y:120,size:24,life:.6,color:'#ffcc33',vy:-40})}});
DS.pickups.register({id:'key',magnet:3,
  mesh(){return new THREE.Mesh(keyGeo,keyMat)},
  collect(p){const G=S.G;save.keys+=p.val;G.keysFound+=p.val;sfx('key');announce(L('KLUCZ!','KEY!'),'+'+p.val+L(' do skrzynek',' crate '+(p.val===1?'key':'keys')))}});
DS.pickups.register({id:'med',magnet:3,
  mesh(){const m=new THREE.Mesh(medGeo,medMat);const c=new THREE.Mesh(medC1,medRed);m.add(c);const c2=new THREE.Mesh(medC2,medRed);m.add(c2);return m},
  collect(p){const G=S.G;const before=G.hp;G.hp=Math.min(G.maxHp,G.hp+p.val);sfx('heal');addFloater('+'+p.val+' HP',{x:200,y:innerHeight-120,size:26,life:.8,color:'#7dff9a',vy:-40});
    DS.bus.emit('heal',{amount:G.hp-before,source:'pickup'})}});

// Co-op (js/net/pickups.js): znajdźki z wrogów ma host (p.nid); klient ma kopie (p.mirror) i prosi o podniesienie (`pick`),
// host potwierdza zdarzeniem, efekt dostaje zbierający. DS.net.onPickup(p, 'spawn'|'take'|'gone') to hook hosta.
export function spawnPickup(type,pos,val,o){
  const G=S.G,coop=DS.net.active();
  // Limit na scenie: najstarsza znajdźka znika, a jej wartość (ZD, klucze) trafia od razu do gracza (w co-op: przepada).
  while(G.pickups.length>=MAX_PICKUPS){const o=G.pickups.shift();
    if(!coop){if(o.type==='coin'){save.coins+=o.val;G.earned+=o.val}else if(o.type==='key'){save.keys+=o.val;G.keysFound+=o.val}}
    else if(DS.net.onPickup)DS.net.onPickup(o,'gone');
    disposeObject(o.m)}
  const m=DS.pickups.get(type).mesh();
  hull(m,.12);m.position.set(pos.x+rand(-.6,.6),.8,pos.z+rand(-.6,.6));scene.add(m);
  const p={m,type,val,vy:rand(3,6),vx:rand(-2,2),vz:rand(-2,2),t:0};
  if(o&&o.nid){p.nid=o.nid;p.mirror=true}
  G.pickups.push(p);
  if(coop&&!p.mirror&&DS.net.onPickup)DS.net.onPickup(p,'spawn');
  return p;
}
export function updatePickups(dt){
  const G=S.G;
  for(const p of G.pickups){p.t+=dt;const m=p.m,def=DS.pickups.get(p.type);
    if(p.t>=LIFE){p.done=true;disposeObject(m);if(p.nid&&!p.mirror&&DS.net.onPickup)DS.net.onPickup(p,'gone');continue}
    if(p.vy!==null){p.vy-=18*dt;m.position.x+=p.vx*dt;m.position.z+=p.vz*dt;m.position.y+=p.vy*dt;if(m.position.y<.35){m.position.y=.35;p.vy=null}}
    m.rotation.y+=dt*4;if(def.spin)def.spin(m,dt);
    const left=LIFE-p.t;m.scale.setScalar(left<BLINK_T?.65+.35*Math.abs(Math.sin(p.t*14)):1);
    const dx=P.pos.x-m.position.x,dz=P.pos.z-m.position.z,d=Math.hypot(dx,dz);
    const mag=def.magnet;
    if(d<mag&&p.t>.35){m.position.x+=dx/d*dt*14;m.position.z+=dz/d*dt*14}
    if(d<1.1&&p.t>.35){
      if(p.mirror){if(!p.req&&!G.dead&&DS.net.requestPickup){p.req=true;DS.net.requestPickup(p)}continue}   // klient: prośba do hosta, efekt po potwierdzeniu
      if(G.dead&&DS.net.active())continue;                                                                // co-op: leżący nie zbiera
      p.done=true;disposeObject(m);
      if(p.nid&&DS.net.onPickup)DS.net.onPickup(p,'take');
      def.collect(p);DS.bus.emit('pickup',{type:p.type,value:p.val})}}
  G.pickups=G.pickups.filter(p=>!p.done);
}
