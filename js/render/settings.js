// Zastosowanie opcji graficznych/dźwiękowych do renderera i sceny.
import {$} from '../core/util.js';
import {opt} from '../core/save.js';
import {DS} from '../core/ds.js';
import {renderer,scene,camera,sun,resize} from './renderer.js';
import {outlines} from './materials.js';
import {applyVolumes} from '../audio/context.js';

export const PRESETS={low:{scale:.6,shadows:0,draw:70},med:{scale:.85,shadows:0,draw:100},high:{scale:1,shadows:1,draw:130},ultra:{scale:1.3,shadows:1,draw:180}};
export function applyOpts(){
  camera.fov=opt.fov*(DS.player.fovMul||1);scene.fog.far=opt.draw;camera.far=Math.max(opt.draw+250,400);
  const sh=!!opt.shadows;if(renderer.shadowMap.enabled!==sh){renderer.shadowMap.enabled=sh;sun.castShadow=sh;scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}})}
  sun.castShadow=sh;
  outlines.forEach(o=>o.visible=!!opt.outlines);
  applyVolumes();resize();
}
