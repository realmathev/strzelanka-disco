// Poziom 1: rynek pod remizą (pierwotna arena, przeniesiona 1:1). Właściciel katalogu: ds-level-designer.
import {DS} from '../../core/ds.js';
import {rand} from '../../core/util.js';
import {scene} from '../../render/renderer.js';
import {toon} from '../../render/materials.js';
import {groundTex} from '../../render/textures.js';
import {addBox} from '../build.js';
import {world} from '../state.js';

DS.levels.register({
  id:'remiza',
  name:'Remiza i rynek',
  arena:42,                              // połowa boku grywalnego kwadratu [m]
  spawn:{x:0,z:30,yaw:0},                // start gracza
  menuCam:{r:26,y:7,look:[0,4,0]},       // orbita kamery w menu
  build(){
    const ARENA=this.arena,P=DS.props;
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),toon(0xffffff,{map:groundTex}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);world.meshes.push(ground);
    // sidewalk ring
    const walk=toon(0xcfc0a0);
    [[0,-ARENA+1.5,ARENA*2,3],[0,ARENA-1.5,ARENA*2,3]].forEach(([x,z,w,d])=>addBox(w,.15,d,x,0,z,walk,{collide:false,cast:false}));
    [[-ARENA+1.5,0,3,ARENA*2],[ARENA-1.5,0,3,ARENA*2]].forEach(([x,z,w,d])=>addBox(w,.15,d,x,0,z,walk,{collide:false,cast:false}));
    const pal=[0xc96f4a,0xd8b26e,0x7c9a92,0xb5534f,0xe0c48a,0x6f7f9c,0x9c6b8f,0xa98e5f];
    let seed=7;const sr=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    const B=P.get('building');
    const row=(axis,fixed,dir)=>{let p=-ARENA-8;while(p<ARENA+8){const w=8+sr()*8,h=8+sr()*16,d=10;const c=p+w/2;
      if(axis==='x')B.place({w,h,d,x:c,z:fixed+dir*d/2,color:pal[Math.floor(sr()*pal.length)]});else B.place({w:d,h,d:w,x:fixed+dir*d/2,z:c,color:pal[Math.floor(sr()*pal.length)]});p+=w}};
    row('x',-ARENA,-1);row('x',ARENA,1);row('z',-ARENA,-1);row('z',ARENA,1);
    // central casino kiosk
    P.get('casinoKiosk').place({});
    // disco sign on a perimeter wall
    P.get('neonSign').place({text:'REMIZA DISCO',color:'#ff4fd8',bg:'#200a24',w:14,h:3.8,x:-8,y:10,z:-ARENA+.05});
    P.get('neonSign').place({text:'LOMBARD',color:'#ffe14a',bg:'#14211a',w:10,h:2.8,x:ARENA-.05,y:7,z:10,rotY:-Math.PI/2});
    // maluchy (little cars)
    const carCols=[0xd3242a,0x2d5fa8,0xe0c040,0x4f8a5b,0xf4efe4,0xe07a2a];
    [[-14,16,0],[16,-14,1],[22,18,0],[-24,-10,1],[6,-28,0],[-28,26,1]].forEach(([x,z,r],i)=>P.get('maluch').place({x,z,r,color:carCols[i%carCols.length]}));
    // crates & barriers
    [[-8,-14],[-6.3,-14],[-7.2,-14,1.6],[12,8],[12,9.7],[30,-30],[31.7,-30],[-30,30],[-20,-28],[26,4],[-34,4],[-34,5.7]].forEach(([x,z,y])=>P.get('crate').place({x,z,s:1.6,y:y||0}));
    [[-18,0,4,.9],[18,0,4,.9],[0,-18,.9,4],[0,18,.9,4],[-28,-28,4,.9],[28,28,.9,4],[-10,30,4,.9]].forEach(([x,z,w,d])=>P.get('barrier').place({x,z,w,d}));
    // lamp posts
    [[-20,20],[20,20],[-20,-20],[20,-20],[0,32],[0,-32]].forEach(([x,z])=>P.get('lampPost').place({x,z}));
    // clouds
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;P.get('cloud').place({x:Math.cos(a)*170,y:55+rand(0,25),z:Math.sin(a)*170})}
  },
});
