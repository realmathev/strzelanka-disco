// Apteczka z ekwipunku (akcja 'medkit', domyślnie H): +50 HP.
import {save,persist} from '../core/save.js';
import {S} from '../core/state.js';
import {DS} from '../core/ds.js';
import {addFloater} from '../render/comicfx.js';
import {sfx} from '../audio/sfx.js';
import {CFG} from './config.js';

export function useMedkit(){
  const G=S.G;if(!(save.medkits>0&&G.hp<G.maxHp))return false;
  const before=G.hp;
  save.medkits--;G.hp=Math.min(G.maxHp,G.hp+CFG.medkit.heal);sfx('heal');addFloater('+50 HP',{x:200,y:innerHeight-120,size:28,life:.8,color:'#7dff9a',vy:-40});persist();
  DS.bus.emit('heal',{amount:G.hp-before,source:'medkit'});
  return true;
}
