// Renderer, scena, kamera i światła. THREE jest globalem z CDN (r128).
import {$} from '../core/util.js';
import {opt} from '../core/save.js';
import {DS} from '../core/ds.js';

export const canvas=$('#gl');
export const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.shadowMap.type=THREE.PCFShadowMap;
export const scene=new THREE.Scene();
export const SKY=0xefc463;
scene.background=new THREE.Color(SKY);
scene.fog=new THREE.Fog(SKY,30,opt.draw);
export const camera=new THREE.PerspectiveCamera(opt.fov,1,.04,500); camera.rotation.order='YXZ'; scene.add(camera);
export const hemi=new THREE.HemisphereLight(0xfff1d0,0x6b5640,.75); scene.add(hemi);
export const sun=new THREE.DirectionalLight(0xffffff,.85); sun.position.set(30,55,18); scene.add(sun); scene.add(sun.target);
Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:150}); sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-.0008;

export function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)*opt.scale);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);

Object.assign(DS.render,{canvas,renderer,scene,camera,sun,hemi});
