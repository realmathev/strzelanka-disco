// P-83 Wanad (9×18 Makarov). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,0061·312² ≈ 297 J -> 26.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'p83wanad', name:'P-83 Wanad', short:'Wanad', key:'6', price:250,
  dmg:26, rate:.3, mag:8, reload:1.1, spread:.006, pellets:1, auto:false,
  snd:'PAF!', sfx:'pistol', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:1, adsFov:.8, adsTime:.14, moveMult:.95, moveMultAds:.57, recoil:{pitch:.0063, yaw:.0016, recovery:8.3},
  real:{cal:'9×18 mm Makarov', mag:8, rpm:null, v0:312, bulletG:6.1, weight:.73, length:165, barrel:90, range:null,
    fire:'półautomat', action:'straight blowback, DA/SA',
    src:['https://en.wikipedia.org/wiki/FB_P-83_Wanad'],
    unv:['rpm','range','bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.2)}, // stub, ds-weapon-modeler
});
