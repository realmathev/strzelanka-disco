// Desert Eagle .50 AE. Formuły i tabela: data/BALANCE.md. dmg: E=½·0,0194·470² ≈ 2143 J -> dmgE 69 -> sufit 40.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'deagle50', name:'Desert Eagle .50 AE', short:'Deagle', key:'7', price:600,
  dmg:40, rate:.3, mag:7, reload:1.1, spread:.006, pellets:1, auto:false,
  snd:'BUM!', sfx:'pistol', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:1, adsFov:.8, adsTime:.22, moveMult:.86, moveMultAds:.52, recoil:{pitch:.0183, yaw:.0046, recovery:8.3},
  real:{cal:'.50 Action Express (.50 AE)', mag:7, rpm:null, v0:470, bulletG:19.4, weight:1.996, length:273.1, barrel:152, range:null,
    fire:'półautomat', action:'gas-operated, closed rotating bolt',
    src:['https://en.wikipedia.org/wiki/Desert_Eagle'],
    unv:['rpm','range','bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.2)}, // stub, ds-weapon-modeler
});
