// Rejestr akcji wejścia z możliwością przypisania klawiszy (rebind).
// Kody: KeyboardEvent.code ('KeyW', 'Space'...), przyciski myszy 'Mouse0'/'Mouse1'/'Mouse2',
// kółko 'WheelUp'/'WheelDown'.
import {createRegistry} from './registry.js';

export function createInput(){
  const reg=createRegistry('input');
  const baseRegister=reg.register;
  const down=Object.create(null); // kod -> wciśnięty?
  return Object.assign(reg,{
    /** def: {id, label, codes:[...], group?}. Zapamiętuje domyślne kody do resetu. */
    register(def){def.codes=(def.codes||[]).slice();def.defaults=def.defaults||def.codes.slice();return baseRegister(def)},
    /** Surowy stan kodów (używany przez listener w player/input.js). */
    codes:down,
    setCode(code,on){down[code]=on},
    releaseAll(){for(const k in down)down[k]=false},
    /** Czy którykolwiek kod przypisany do akcji jest wciśnięty. */
    isDown(id){const a=reg.get(id);if(!a)return false;const c=a.codes;for(let i=0;i<c.length;i++)if(down[c[i]])return true;return false},
    /** Czy dany kod wyzwala akcję. */
    matches(id,code){const a=reg.get(id);return !!a&&a.codes.indexOf(code)>=0},
    /** Lista akcji przypisanych do kodu. */
    actionsFor(code){return reg.all().filter(a=>a.codes.indexOf(code)>=0).map(a=>a.id)},
    bind(id,codes){const a=reg.get(id);if(a)a.codes=codes.slice()},
    reset(id){(id?[reg.get(id)]:reg.all()).forEach(a=>{if(a)a.codes=a.defaults.slice()})},
    /** Kody przypisane do więcej niż jednej akcji: {code:[actionId,...]}. */
    conflicts(){const m={};reg.all().forEach(a=>a.codes.forEach(c=>(m[c]=m[c]||[]).push(a.id)));for(const c in m)if(m[c].length<2)delete m[c];return m},
    /** Mapowanie do zapisu w opcjach: {actionId:[codes]}. */
    serialize(){const o={};reg.all().forEach(a=>o[a.id]=a.codes.slice());return o},
    load(map){if(map)for(const id in map)if(reg.has(id)&&Array.isArray(map[id]))reg.get(id).codes=map[id].slice()},
  });
}
