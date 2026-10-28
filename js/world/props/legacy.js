// Rekwizyty z pierwotnej mapy (przeniesione 1:1 z monolitu). Właściciel katalogu: ds-world-modeler.
// Każdy prop: DS.props.register({id, place(opts) -> Object3D}).
import {DS} from '../../core/ds.js';
import {scene} from '../../render/renderer.js';
import {toon} from '../../render/materials.js';
import {signTex,cloudTex} from '../../render/textures.js';
import {addBox,building} from '../build.js';
import {addPart} from '../batch.js';
import {world} from '../state.js';

DS.props.register({id:'building',place:({w,h,d,x,z,color})=>building(w,h,d,x,z,color)});

/** Szyld neonowy: płaszczyzna świecąca (bez mgły), patrzy w +Z przed obrotem rotY. */
DS.props.register({id:'neonSign',place({text,color,bg,w,h,x,y,z,rotY=0}){
  // polygonOffset: szyld wisi 5 cm przed ścianą; offset chroni przed z-fightingiem przy słabszym buforze głębi.
  const s=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTex(text,color,bg),fog:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));
  s.position.set(x,y,z);s.rotation.y=rotY;scene.add(s);world.neon.push(s);return s}});

/** Kiosk-kasyno na środku rynku: bryła, dach, 2 neony, słupki, girlandy żarówek. */
DS.props.register({id:'casinoKiosk',place(){
  const m=addBox(12,6,9,0,0,0,toon(0x8b1e2b));
  addBox(13,.8,10,0,6,0,toon(0xe3a91a));
  const neon=DS.props.get('neonSign');
  neon.place({text:'KASYNO',color:'#ffe14a',bg:'#3a0a12',w:9,h:2.4,x:0,y:8.2,z:4.55});
  neon.place({text:'JACKPOT',color:'#43f0ff',bg:'#0a1a2a',w:9,h:2.4,x:0,y:8.2,z:-4.55,rotY:Math.PI});
  const pole=toon(0x2a2420);addBox(.4,1.5,.4,-3.5,6.8,4.6,pole,{collide:false});addBox(.4,1.5,.4,3.5,6.8,4.6,pole,{collide:false});
  addBox(.4,1.5,.4,-3.5,6.8,-4.6,pole,{collide:false});addBox(.4,1.5,.4,3.5,6.8,-4.6,pole,{collide:false});
  // 28 żarówek = jeden InstancedMesh (kolor per instancja ustawia animateWorld). Instancja 2i = przód, 2i+1 = tył.
  const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0xffffff}),28);
  const mx=new THREE.Matrix4(),c0=new THREE.Color(0xffe14a);
  for(let i=0;i<14;i++){const x=-6+i*12/13;
    bulbs.setMatrixAt(2*i,mx.makeTranslation(x,5.6,4.6));bulbs.setColorAt(2*i,c0);
    bulbs.setMatrixAt(2*i+1,mx.makeTranslation(x,5.6,-4.6));bulbs.setColorAt(2*i+1,c0)}
  bulbs.frustumCulled=false;scene.add(bulbs);world.bulbs.push(bulbs);
  return m}});

/** Fiat 126p (uproszczony). r=1: obrócony wzdłuż Z. */
DS.props.register({id:'maluch',place({x,z,r=0,color=0xd3242a}){
  const col=toon(color);const L=r?1.7:3.3,W=r?3.3:1.7;
  const m=addBox(L,1,W,x,.35,z,col,{hull:.05});addBox(r?1.5:1.9,.8,r?1.9:1.5,x,1.35,z,col,{hull:.06,collide:false});
  const glass=toon(0x9fc3cf);addBox(r?1.55:1.95,.45,r?1.95:1.55,x,1.55,z,glass,{collide:false,cast:false});
  // Koła: bez cienia, bez odbioru cienia, poza raycastem; jeden globalny kubełek 'wheels' + kontur-kadłub w kafelku.
  const wh={color:0x1b1714},wg=new THREE.CylinderGeometry(.35,.35,.3,12);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const mx=r?new THREE.Matrix4().makeRotationZ(Math.PI/2):new THREE.Matrix4().makeRotationX(Math.PI/2);
    mx.setPosition(x+a*(r?.75:1.1),.35,z+b*(r?1.1:.75));addPart(wg,mx,wh,{group:'wheels',cast:false,receive:false,ray:false,hull:.08})});
  return m}});

const wood=toon(0xa8743a);
/** Drewniana skrzynia s×s×s; postawiona na innej (y>0) nie koliduje. */
DS.props.register({id:'crate',place:({x,z,s=1.6,y=0})=>addBox(s,s,s,x,y,z,wood,{hull:.04,collide:y===0})});

const conc=toon(0xbfb6a6);
/** Betonowa zapora wysokości 1,2 m. */
DS.props.register({id:'barrier',place:({x,z,w,d})=>addBox(w,1.2,d,x,0,z,conc)});

const lp=toon(0x2a2420),lampGlobe=new THREE.SphereGeometry(.5,10,8);
/** Latarnia 7 m z kulistym kloszem. */
DS.props.register({id:'lampPost',place({x,z}){addBox(.3,7,.3,x,0,z,lp,{collide:false});
  // Klosz: MeshBasic bez konturu i cienia, wszystkie klosze w jednym globalnym kubełku 'globes'.
  addPart(lampGlobe,new THREE.Matrix4().makeTranslation(x,7.2,z),{color:0xfff2b0},{group:'globes',basic:true,cast:false,receive:false,ray:false,edges:false});
  const h=new THREE.Object3D();h.position.set(x,7.2,z);return h}});

/** Chmura-sprite (bez mgły). */
DS.props.register({id:'cloud',place({x,y,z}){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,fog:false,transparent:true}));s.position.set(x,y,z);s.scale.set(60,30,1);scene.add(s);return s}});
