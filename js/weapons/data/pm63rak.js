// PM-63 RAK (9×18 Makarov). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,0061·320² ≈ 312 J -> 27; rate 60/650≈0,092 -> nmin 3 -> dmg 27.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'pm63rak', name:'PM-63 RAK', short:'PM-63', key:'11', price:500,
  dmg:27, rate:.092, mag:25, reload:1.6, spread:.03, pellets:1, auto:true,
  snd:'TAK-TAK!', sfx:'smg', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:2, adsFov:.8, adsTime:.2, moveMult:.89, moveMultAds:.53, recoil:{pitch:.0044, yaw:.0011, recovery:25},
  real:{cal:'9×18 mm Makarov', mag:25, rpm:650, v0:320, bulletG:6.1, weight:1.6, length:583, barrel:152, range:null,
    fire:'półautomat/automat (dwustopniowy spust)', action:'straight blowback, otwarty zamek',
    src:['https://en.wikipedia.org/wiki/PM-63'],
    unv:['range','bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.25)}, // stub, ds-weapon-modeler
});
