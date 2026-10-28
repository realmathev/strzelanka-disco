// Glock 17 (9×19). Formuły i tabela: data/BALANCE.md. dmg: E=½·0,008·360² ≈ 518 J -> 34.
import {DS} from '../../core/ds.js';
DS.weapons.register({
  id:'glock17', name:'Glock 17', short:'Glock', key:'5', price:350,
  dmg:34, rate:.3, mag:17, reload:1.1, spread:.006, pellets:1, auto:false,
  snd:'BANG!', sfx:'pistol', kick:.45, pitchKick:.012, shake:.08, burst:false,
  slot:1, adsFov:.8, adsTime:.14, moveMult:.96, moveMultAds:.58, recoil:{pitch:.0103, yaw:.0026, recovery:8.3},
  real:{cal:'9×19 mm Parabellum', mag:17, rpm:null, v0:null, bulletG:8.0, weight:.63, length:202, barrel:114, range:null,
    fire:'półautomat', action:'krótki odrzut, zamek ryglowany (lufa wahliwa)',
    src:['https://en.wikipedia.org/wiki/Glock_17','https://us.glock.com/en/Pistols/G17-Gen5-FS-US'],
    unv:['rpm','v0','range','bulletG']},
  model({muzzle}){muzzle.set(0,.02,-.2)}, // stub, ds-weapon-modeler
});
