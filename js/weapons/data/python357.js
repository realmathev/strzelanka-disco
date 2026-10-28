// Colt Python .357 Magnum (rewolwer). Formuły i tabela: data/BALANCE.md. v0 niezweryfikowane: założone 430 m/s -> dmgE 46 -> sufit 40.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'python357', name:'Colt Python .357', short:'Python', key:'8', price:700,
  dmg:40, rate:.35, mag:6, reload:2, spread:.006, pellets:1, auto:false,
  snd:'BAM!', sfx:'pistol', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:1, adsFov:.8, adsSpread:.55, adsTime:.17, moveMult:.92, moveMultAds:.55, recoil:{pitch:.0119, yaw:.0030, recovery:7.1},
  real:{cal:'.357 Magnum', mag:6, rpm:null, v0:null, bulletG:10.2, weight:1.1, length:null, barrel:152, range:null,
    fire:'podwójne (DA/SA)', action:'rewolwer, DA/SA',
    src:['https://en.wikipedia.org/wiki/Colt_Python'],
    unv:['rpm','v0','length','range','bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.2)}, // stub, ds-weapon-modeler
});
