// AKM (7,62×39). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,008·715² ≈ 2045 J -> 40; rate 60/600=0,1 -> nmin 3 -> dmg 30.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'akm', name:'AKM', short:'AKM', key:'14', price:1300,
  dmg:30, rate:.1, mag:30, reload:1.8, spread:.012, pellets:1, auto:true,
  snd:'TRRRT!', sfx:'rifle', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:4, adsFov:.8, adsTime:.30, moveMult:.77, moveMultAds:.46, recoil:{pitch:.0089, yaw:.0022, recovery:25},
  real:{cal:'7.62×39 mm', mag:30, rpm:600, v0:715, bulletG:8.0, weight:3.3, length:880, barrel:null, range:300,
    fire:'selektywny (półautomat/automat)', action:'gas-operated, long-stroke piston, closed rotating bolt',
    src:['https://en.wikipedia.org/wiki/AKM'],
    unv:['bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
