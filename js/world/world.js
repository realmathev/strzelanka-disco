// Ładowanie i sprzątanie poziomu, animacja dekoracji (neony, żarówki).
import {DS} from '../core/ds.js';
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {scene} from '../render/renderer.js';
import {disposeObject,pruneOutlines} from '../render/materials.js';
import {world} from './state.js';
import {flushBatches,resetBatches} from './batch.js';

/** Obiekty sceny dodane przez bieżący poziom (diff scene.children przed/po build + flush); clearLevel je zwalnia. */
let levelObjs=[];

/**
 * Sprząta poziom: zdejmuje ze sceny i zwalnia (geometrie, materiały, tekstury neonów, kontury) wszystko, co dodał build(),
 * czyści world.colliders/meshes/neon/bulbs, decale rekwizytów i niesklejone części. Emituje 'levelUnload' ({level}), na które
 * słuchają moduły z własnymi obiektami poziomu (pickups/machines.js: automaty). Wołane z loadLevel; można też ręcznie.
 */
export function clearLevel(){
  DS.bus.emit('levelUnload',{level:world.level&&world.level.id});
  resetBatches();
  if(DS.props.resetDecals)DS.props.resetDecals();
  // Tekstury szyldów: tworzone per szyld, więc zwalniane tu (cache neonTex i tak wgra się ponownie, gdy będzie potrzebna).
  for(const s of world.neon)if(s.material&&s.material.map)s.material.map.dispose();
  for(const o of levelObjs)disposeObject(o);
  levelObjs=[];
  world.colliders.length=0;world.meshes.length=0;world.neon.length=0;world.bulbs.length=0;
  pruneOutlines();
}

/**
 * Buduje poziom z DS.levels. Najpierw sprząta poprzedni (clearLevel), więc można przełączać poziomy bez wycieku
 * i wracać do tego samego (statyczne części są budowane od nowa). Emituje 'levelLoad' ({level}).
 * Nie wołać w trakcie runu (wrogowie/znajdźki żyją w scenie obok świata, ale gracz stałby na nowej mapie).
 */
export function loadLevel(id){
  const L=DS.levels.get(id);if(!L)throw new Error('Brak poziomu: '+id);
  clearLevel();
  world.level=L;world.arena=L.arena||42;
  const before=new Set(scene.children);
  try{
    L.build(world);
    flushBatches();   // skleja części dodane przez addBox/addPart w siatki per kafelek
  }finally{
    resetBatches();   // po wyjątku w build(): porzuć niesklejone części
    levelObjs=scene.children.filter(o=>!before.has(o));
  }
  DS.bus.emit('levelLoad',{level:L.id});
  return L;
}
// Wybór poziomu w menu (ui/menu.js emituje 'levelSelect'): wczytaj go od razu, żeby menu pokazywało wybraną mapę.
DS.bus.on('levelSelect',e=>{
  const id=e&&e.level;if(!id||S.mode==='game'||(world.level&&world.level.id===id)||!DS.levels.has(id))return;
  try{loadLevel(id)}catch(err){console.error('loadLevel',id,err)}
});
// Neony migoczą przez przygaszenie koloru, a nie przez visible=false.
// (Błąd: dawniej `visible=false` przez ~7,8% każdego cyklu 0,9 s, więc przy 4 szyldach
// w ~25% klatek któryś szyld znikał w całości; materiał nie jest przezroczysty, więc
// ustawiane obok `opacity` nic nie dawało.)
const NEON_DIM=.3,BULB_ON=new THREE.Color(0xfff2a8),BULB_OFF=new THREE.Color(0x6b4a10);
export function animateWorld(t,dt){
  const K=opt.fx;
  const neon=world.neon;for(let i=0;i<neon.length;i++){const s=neon[i];s.visible=true;s.material.color.setScalar(Math.sin(t*7+i*3)>.97&&K>0?NEON_DIM:1)}
  // Żarówki: world.bulbs to InstancedMesh-e; kolor per instancja, wysyłany do GPU tylko gdy zmienił się wzór.
  const bulbs=world.bulbs;for(let b=0;b<bulbs.length;b++){const im=bulbs[b],step=K===0?-1:Math.floor(t*(K===2?12:6)),key=step*4+K;
    if(im.userData.k===key)continue;im.userData.k=key;
    for(let i=0;i<im.count;i++){const on=K===0?(i%2===0):((step+i)%3===0);im.setColorAt(i,on?BULB_ON:BULB_OFF)}
    im.instanceColor.needsUpdate=true}
}
