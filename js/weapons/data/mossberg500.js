// Mossberg 500 (12/70, pompka). Formuły i tabela: data/BALANCE.md. Śrut: 9 × 13 (kalibracja legacy), rate 0,8 (cykl pompki).
// Odrzut: ładunek 28 g przy 400 m/s (założenie, real.unv) -> Erec ≈ 20 J.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'mossberg500', name:'Mossberg 500', short:'Mossberg', key:'12', price:650,
  dmg:13, rate:.8, mag:6, reload:2, spread:.09, pellets:9, auto:false,
  snd:'BUUUM!', sfx:'shotgun', kick:1, pitchKick:.035, shake:.35, burst:true,
  slot:3, adsFov:.8, adsTime:.29, moveMult:.78, moveMultAds:.47, recoil:{pitch:.0178, yaw:.0044, recovery:4},
  real:{cal:'12/70 (śrut 00 buck, 9 śrutów - niepotwierdzone w źródle)', mag:6, rpm:null, v0:null, bulletG:null, weight:3.18, length:917, barrel:null, range:null,
    fire:'pompka', action:'pump action',
    src:['https://en.wikipedia.org/wiki/Mossberg_500'],
    unv:['rpm','v0','range','pellets']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
