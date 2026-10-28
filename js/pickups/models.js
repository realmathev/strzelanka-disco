// Modele znajdziek i automatów: nisko-poligonowe, toon, wymiary w metrach zbliżone do realnych.
// Geometrie i materiały współdzielone (tworzone raz). Każda funkcja zwraca Mesh (korpus), dzieci = detale.
import {shared,sMat} from './shared.js';

const geo=g=>shared(g);
const gBox=(w,h,d)=>geo(new THREE.BoxGeometry(w,h,d));
const gCyl=(r,h,s=10)=>geo(new THREE.CylinderGeometry(r,r,h,s));
const M={
  white:sMat(0xf4efe4), red:sMat(0xd3242a), cyan:sMat(0x43c7ff,{emissive:0x05202a}),
  orange:sMat(0xff8a2a), bread:sMat(0xd9a05b), cheese:sMat(0xffd84a,{emissive:0x332a00}),
  meat:sMat(0x8a4b22), tomato:sMat(0xe0402a), salad:sMat(0x6dbb4a), wrap:sMat(0xf2e3b0),
  beer:sMat(0x6b3f1d), gold:sMat(0xffcc33,{emissive:0x332200}), navy:sMat(0x2e3a52),
  steel:sMat(0x9aa3ad), green:sMat(0x2fb85a,{emissive:0x0b2a14}), glass:sMat(0x7fe3ff,{emissive:0x0a3a4a}),
  machine:sMat(0xd3242a), cabinet:sMat(0xf4efe4),
};
const G={
  bandage:gBox(.16,.02,.1), bandageRed:gBox(.165,.022,.03),
  barrel:gCyl(.018,.12), plunger:gBox(.035,.02,.035), needle:gCyl(.004,.04,6),
  bread:gCyl(.04,.22,8), cheese:gBox(.03,.12,.07),
  kebab:gCyl(.05,.2,8), salad:gBox(.05,.14,.05),
  bottle:gCyl(.033,.16,10), neck:gCyl(.015,.05,8), cap:gCyl(.017,.012,8),
  vest:gBox(.34,.36,.1), vestStripe:gBox(.345,.05,.102), vestPocket:gBox(.1,.08,.02),
  vmBody:gBox(.9,1.9,.65), vmGlass:gBox(.7,1.1,.02), vmCrossA:gBox(.2,.05,.01), vmCrossB:gBox(.05,.2,.01), vmSlot:gBox(.5,.12,.02),
  stBody:gBox(.7,1.6,.5), stCrossA:gBox(.3,.08,.01), stCrossB:gBox(.08,.3,.01), stDoor:gBox(.5,.9,.02),
};
const mesh=(g,m)=>new THREE.Mesh(g,m);
const add=(parent,g,m,x=0,y=0,z=0)=>{const c=mesh(g,m);c.position.set(x,y,z);parent.add(c);return c};

export function modelBandage(){const m=mesh(G.bandage,M.white);add(m,G.bandageRed,M.red,0,.002,0);return m}
export function modelAdrenaline(){
  const m=mesh(G.barrel,M.cyan);add(m,G.plunger,M.orange,0,.075,0);add(m,G.needle,M.steel,0,-.08,0);return m;
}
export function modelZapiekanka(){
  const m=mesh(G.bread,M.bread);m.rotation.z=Math.PI/2;add(m,G.cheese,M.cheese,.04,0,0);return m;
}
export function modelKebab(){
  const m=mesh(G.kebab,M.wrap);m.rotation.z=Math.PI/2;add(m,G.salad,M.salad,.045,0,0);add(m,G.salad,M.tomato,-.045,0,0);return m;
}
export function modelZubr(){
  const m=mesh(G.bottle,M.beer);add(m,G.neck,M.beer,0,.105,0);add(m,G.cap,M.gold,0,.135,0);return m;
}
export function modelVest(){
  const m=mesh(G.vest,M.navy);add(m,G.vestStripe,M.red,0,.05,0);add(m,G.vestPocket,M.steel,.09,.06,.06);return m;
}

/** Automat apteczny (vending) albo stacja leczenia. Origin = podłoga, przód w +Z. Zwraca Group. */
export function buildMachine(kind){
  const g=new THREE.Group();
  if(kind==='vending'){
    const body=mesh(G.vmBody,M.machine);body.position.y=.95;g.add(body);
    add(body,G.vmGlass,M.glass,0,.1,.335);add(body,G.vmCrossA,M.white,0,.7,.345);add(body,G.vmCrossB,M.white,0,.7,.345);
    add(body,G.vmSlot,M.steel,0,-.85,.34);
  }else{
    const body=mesh(G.stBody,M.cabinet);body.position.y=.8;g.add(body);
    add(body,G.stDoor,M.white,0,0,.26);
    add(body,G.stCrossA,M.green,0,.5,.26);add(body,G.stCrossB,M.green,0,.5,.26);
  }
  return g;
}
