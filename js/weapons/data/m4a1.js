// M4A1 (5,56×45). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,004·910² ≈ 1656 J -> 40; rate 60/700≈0,086 (dolna granica 700-970) -> nmin 3 -> dmg 30.
// v0 910 m/s to wartość dla M4 z M855A1 (źródło nie podaje osobno dla lufy M4A1).
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'m4a1', name:'M4A1', short:'M4A1', key:'15', price:1500,
  dmg:30, rate:.086, mag:30, reload:1.8, spread:.012, pellets:1, auto:true,
  snd:'BRRAP!', sfx:'rifle', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:4, adsFov:.8, adsSpread:.45, adsTime:.28, moveMult:.80, moveMultAds:.48, recoil:{pitch:.0060, yaw:.0015, recovery:25},
  real:{cal:'5.56×45 mm NATO', mag:30, rpm:700, v0:910, bulletG:4.0, weight:2.92, length:838, barrel:null, range:500,
    fire:'safe/półautomat/automat (M4A1)', action:'gas-operated, closed rotating bolt',
    src:['https://en.wikipedia.org/wiki/M4_carbine'],
    unv:['bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
