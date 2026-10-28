// Mosin wz. 91/30 (7,62×54R, repetier). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,0096·865² ≈ 3592 J -> sufit 40; rate 1,2 (ręczny cykl).
// ADS: model ma przyrządy mechaniczne (bez lunety), wiec efektywne powiekszenie Mz ≈ 1,5 (tylko ciasniejszy kadr) -> adsFov = 0,8/√1,5 ≈ 0,65.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'mosin9130', name:'Mosin wz. 91/30', short:'Mosin', key:'18', price:900,
  dmg:40, rate:1.2, mag:5, reload:2, spread:.003, pellets:1, auto:false,
  snd:'BUM!', sfx:'rifle', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:5, adsFov:.65, adsSpread:.3, adsTime:.37, moveMult:.72, moveMultAds:.43, recoil:{pitch:.0117, yaw:.0029, recovery:4},
  real:{cal:'7.62×54 mm R', mag:5, rpm:null, v0:865, bulletG:9.6, weight:4, length:1232, barrel:null, range:500, mag_x:1.5,
    fire:'repetier (ręczny)', action:'bolt-action',
    src:['https://en.wikipedia.org/wiki/Mosin%E2%80%93Nagant'],
    unv:['rpm','bulletG','mag_x']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
