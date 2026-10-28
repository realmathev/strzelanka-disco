// SVD Dragunow (7,62×54R). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,0096·830² ≈ 3307 J -> sufit 40; półautomat bez rpm -> rate 0,3 -> dmg 40.
// ADS: luneta PSO-1, założone powiększenie 4x (real.unv) -> adsFov = 0,8/√4 = 0,4.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'svd', name:'SVD Dragunow', short:'SVD', key:'17', price:1800,
  dmg:40, rate:.3, mag:10, reload:1.8, spread:.003, pellets:1, auto:false,
  snd:'PAF!', sfx:'rifle', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:5, adsFov:.4, adsTime:.46, moveMult:.70, moveMultAds:.42, recoil:{pitch:.0109, yaw:.0027, recovery:8.3},
  real:{cal:'7.62×54 mm R', mag:10, rpm:null, v0:830, bulletG:9.6, weight:4.3, length:1225, barrel:null, range:800,
    fire:'półautomat', action:'gas-operated, short-stroke piston, rotating bolt', sight:'PSO-1', mag_x:4,
    src:['https://en.wikipedia.org/wiki/SVD_Dragunov'],
    unv:['rpm','bulletG','mag_x']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
