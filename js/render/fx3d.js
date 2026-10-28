// Efekty 3D z czasem życia: smugi pocisków i obłoczki trafień.
import {S} from '../core/state.js';
import {scene} from './renderer.js';
import {puffTex} from './textures.js';

export function addTracer(a,b,col,life){const geo=new THREE.BufferGeometry().setFromPoints([a.clone(),b.clone()]);const l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:col,transparent:true}));scene.add(l);S.G.fx3d.push({o:l,t:life,life})}
export function puff(p){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true}));s.position.copy(p);s.scale.set(.3,.3,1);scene.add(s);S.G.fx3d.push({o:s,t:.35,life:.35,grow:1.6})}
export function updateFx3d(dt){const G=S.G;for(const f of G.fx3d){f.t-=dt;const k=Math.max(f.t/f.life,0);f.o.material.opacity=k;if(f.grow){const s=.3+(1-k)*f.grow;f.o.scale.set(s,s,1)}if(f.t<=0){scene.remove(f.o);f.o.material.dispose();if(f.o.geometry&&!f.grow)f.o.geometry.dispose();f.dead=true}}G.fx3d=G.fx3d.filter(f=>!f.dead)}
