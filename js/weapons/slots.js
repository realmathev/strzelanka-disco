// Sloty broni: klawisze 1-6 wybierają SLOT (nie konkretną broń). Ponowne naciśnięcie klawisza przełącza między
// posiadanymi broniami tego slotu. Slot broni = pole `slot` w definicji (1..6), domyślnie 1.
import {save} from '../core/save.js';
import {DS} from '../core/ds.js';

/** Nazwy slotów (indeks 0 = slot 1). Klawisze: akcje weapon1..weapon6 (js/input/actions.js). */
export const SLOT_NAMES=['pistolety','pistolety maszynowe','strzelby','karabiny','karabiny wyborowe','karabiny maszynowe'];
export const SLOT_COUNT=SLOT_NAMES.length;
/** Stare id broni w zapisach -> aktualne id. 'smg' (Uzi „Weselne” z fazy 0) = dzisiejsze 'uzi'. */
export const WEAPON_ALIAS={smg:'uzi'};
export const canonWeapon=id=>WEAPON_ALIAS[id]||id;

/** Slot broni (1..SLOT_COUNT). */
export function slotOf(id){const W=DS.weapons.get(canonWeapon(id));const s=W&&W.slot;return s>=1&&s<=SLOT_COUNT?s:1}
/** Wszystkie id broni posortowane wg slotu (stabilnie: w obrębie slotu kolejność rejestracji). */
export function weaponsBySlot(){return DS.weapons.ids().map((id,i)=>({id,i,s:slotOf(id)})).sort((a,b)=>a.s-b.s||a.i-b.i).map(x=>x.id)}
/** Posiadane bronie (z aliasami z zapisu) posortowane wg slotu. */
export function ownedWeapons(){const own=new Set(save.weapons.map(canonWeapon));return weaponsBySlot().filter(w=>own.has(w))}
/** Posiadane bronie jednego slotu. */
export function slotWeapons(slot){return ownedWeapons().filter(w=>slotOf(w)===slot)}
/** Etykieta klawisza slotu (z aktualnych przypisań, np. „2”). */
export function slotKeyLabel(slot){return DS.input.keyFor('weapon'+slot)}
/** Etykieta klawisza broni (klawisz jej slotu). */
export function weaponKeyLabel(id){return slotKeyLabel(slotOf(id))}
/** Opis do UI: „klawisz 2 (pistolety maszynowe)”. */
export function weaponKeyHint(id){const s=slotOf(id);return 'klawisz '+slotKeyLabel(s)+' ('+SLOT_NAMES[s-1]+')'}
