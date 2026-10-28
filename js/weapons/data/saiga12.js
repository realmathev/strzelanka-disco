// Saiga-12 (12/70, półautomat). Formuły i tabela: data/BALANCE.md. rate 60/200=0,3; 9 śrutów × 13 (legacy).
// Odrzut: ładunek 28 g przy 400 m/s (założenie, real.unv).
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'saiga12', name:'Saiga-12', short:'Saiga', key:'13', price:800,
  dmg:13, rate:.3, mag:10, reload:2, spread:.09, pellets:9, auto:false,
  snd:'BUUUM!', sfx:'shotgun', kick:1, pitchKick:.035, shake:.35, burst:true,
  slot:3, adsFov:.8, adsSpread:.8, adsTime:.32, moveMult:.75, moveMultAds:.45, recoil:{pitch:.0167, yaw:.0042, recovery:8.3},
  real:{cal:'12/70 (śrut 00 buck, 9 śrutów - niepotwierdzone w źródle)', mag:10, rpm:200, v0:null, bulletG:null, weight:3.6, length:1145, barrel:null, range:70,
    fire:'półautomat (wariant automatyczny 450 strz./min nieużyty w grze)', action:'gas-operated, rotating bolt',
    src:['https://en.wikipedia.org/wiki/Saiga-12'],
    unv:['v0','pellets']},
  model({muzzle}){muzzle.set(0,.02,-.4)}, // stub, ds-weapon-modeler
});
