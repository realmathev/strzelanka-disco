// Trudność (opt.difficulty: 'easy' | 'normal' | 'hard'). Mnożniki wrogów liczone przy spawnie (enemies/manager.js).
// Progresja (XP) i regeneracja pancerza czytają opt.difficulty same. Nieznana wartość = normalna.
import {opt} from './save.js';

export const DIFFICULTY={
  easy:{hp:.75,dmg:.75},
  normal:{hp:1,dmg:1},
  hard:{hp:1.35,dmg:1.25},
};
/** Mnożniki {hp, dmg} bieżącej trudności. Nie modyfikuj zwróconego obiektu. */
export function diffMul(){return DIFFICULTY[opt.difficulty]||DIFFICULTY.normal}