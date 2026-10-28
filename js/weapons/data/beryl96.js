// Beryl wz. 96 (5,56×45). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,004·920² ≈ 1693 J -> 40; rate 60/700≈0,086 -> nmin 3 -> dmg 30.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'beryl96', name:'Beryl wz. 96', short:'Beryl', key:'16', price:1200,
  dmg:30, rate:.086, mag:30, reload:1.8, spread:.012, pellets:1, auto:true,
  snd:'BRRAP!', sfx:'rifle', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:4, adsFov:.8, adsTime:.30, moveMult:.77, moveMultAds:.46, recoil:{pitch:.0057, yaw:.0014, recovery:25},
  real:{cal:'5.56×45 mm NATO', mag:30, rpm:700, v0:920, bulletG:4.0, weight:3.35, length:943, barrel:457, range:600,
    fire:'selektywny (tryby nieokreślone w źródle)', action:'gas-operated, rotating bolt',
    src:['https://en.wikipedia.org/wiki/FB_Beryl'],
    unv:['bulletG','fire']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
