// Współdzielone geometrie i materiały znajdziek. Flaga `shared`: disposeObject ich nie zwalnia.
import {toon} from '../render/materials.js';

export const shared=o=>(o.userData.shared=true,o);
export const sMat=(c,x)=>shared(toon(c,x));
