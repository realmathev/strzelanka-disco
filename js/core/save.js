// Zapis gry i opcje. Klucze localStorage NIE MOGĄ się zmienić (zapisy graczy).
import {store} from './util.js';
import {bus} from './bus.js';

export const SAVE_KEY='discoStrzelnica.save.v1', OPT_KEY='discoStrzelnica.opt.v1';
export const DEF_SAVE={coins:300,keys:1,weapons:['pistol'],skin:'fabryczny',skins:['fabryczny'],medkits:1,hpLvl:0,dmgLvl:0,secondChance:0,best:0,kills:0};
// Głęboka kopia: dawniej save.weapons/skins współdzieliły tablice z DEF_SAVE, więc zakupy
// bez wcześniejszego zapisu modyfikowały DEF_SAVE i „Wyzeruj zapis” zostawiał kupione bronie.
const freshSave=()=>JSON.parse(JSON.stringify(DEF_SAVE));
// `save` i `opt` to stałe obiekty: mutuj pola, nigdy nie podmieniaj referencji.
export const save=Object.assign(freshSave(),store.get(SAVE_KEY,{}));
// Migracja zapisów: id broni z fazy 0 -> aktualne (smg = Uzi „Weselne” zastąpione przez uzi), bez duplikatów. Nieznane id zostają.
// Lista musi zawierać 'pistol'. Zapis na dysk nastąpi przy najbliższym persist().
{const A={smg:'uzi'};if(Array.isArray(save.weapons)){save.weapons=[...new Set(save.weapons.map(w=>A[w]||w))];if(!save.weapons.includes('pistol'))save.weapons.unshift('pistol')}}
export const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DEF_OPT={preset:'high',scale:1,fov:80,draw:120,shadows:1,outlines:1,panels:1,onoma:1,fx:reduced?0:1,music:.6,sfx:.8,track:'A',sens:1,invert:0};
export const opt=Object.assign({},DEF_OPT,store.get(OPT_KEY,{}));

/** Zapisuje `save` i emituje 'save' (UI odświeża portfel). */
export function persist(){store.set(SAVE_KEY,save);bus.emit('save',save)}
export function persistOpt(){store.set(OPT_KEY,opt)}
/** Zeruje zapis w miejscu (odpowiednik dawnego `save=Object.assign({},DEF_SAVE)`). */
export function resetSave(){for(const k of Object.keys(save))delete save[k];Object.assign(save,freshSave())}
