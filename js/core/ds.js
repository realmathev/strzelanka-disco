// Przestrzeń nazw DS: jedyny punkt styku między domenami (patrz ARCHITECTURE.md).
import {bus} from './bus.js';
import {createRegistry} from './registry.js';
import {createInput} from './input.js';
import {S} from './state.js';
import {save,opt} from './save.js';

export const DS={
  bus,
  weapons:createRegistry('weapons'),
  enemies:createRegistry('enemies'),
  levels:createRegistry('levels'),
  props:createRegistry('props'),
  perks:createRegistry('perks'),
  pickups:createRegistry('pickups'),
  input:createInput(),
  state:S,   // DS.state.G, DS.state.mode
  save,      // meta-zapis (mutuj pola, potem persist())
  opt,       // opcje
  player:{}, // wypełnia player/player.js i weapons/viewmodel.js
  render:{}, // wypełnia render/renderer.js
  world:null,// wypełnia world/state.js
  // Co-op (js/net/): stub dla trybu solo i stron bez modułu sieci (tools/*.html). js/net/session.js podmienia metody.
  net:{active:()=>false,isHost:()=>false,isClient:()=>false},
};
// Do debugowania w konsoli przeglądarki.
window.DS=DS;
