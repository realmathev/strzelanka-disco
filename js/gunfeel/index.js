// Feeling broni (właściciel: ds-gunfeel). Liczby: tuning.js (uzasadnienie: TUNING.md).
//  feel.js    ADS, odrzut (sprężyny + krzywe + wzorce), sway/bob/sprint/skok/oddech, złożenie viewmodelu i kamery
//  anim.js    dobycie, przeładowanie w fazach (wariant „na zamku”), pompka, zamek Mosina, taśma PKM, bęben Pythona
//  fx.js      światło błysku, łuski, dym, smugi, iskry/pył/krew, dziury po kulach (pule, stała liczba obiektów w scenie)
//  overlay.js siatka lunety, znacznik zabicia/headshota, przygaszanie celownika w ADS, hit-stop
//  ../audio/gunsfx.js  warstwowe dźwięki (profile kalibrów z tuning.js: AUDIO)
// Hooki: DS.bus 'update'/'shot'/'hit'/'kill', DS.player.viewmodel/flash/camOffset/vmOffset/fovMul/addRecoil/recoilMul/speedMul.
// Debug w konsoli: DS.gunfeel (F = stan, T = tabele, fx() = liczniki efektów, invalidate() po zmianie tabel w locie).
import {DS} from '../core/ds.js';
import {setGunAudio} from '../audio/gunsfx.js';
import * as T from './tuning.js';
import {F} from './feel.js';
import {fxStats} from './fx.js';
import {hitStopActive} from './overlay.js';

setGunAudio(T.AUDIO);
DS.gunfeel={T,F,fx:fxStats,hitStopActive,weaponFeel:T.weaponFeel,invalidate(){T.invalidate();F.model=null}};
export {T,F};
