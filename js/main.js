// Punkt wejścia. Edytuje tylko ds-architect. Domeny dopinają się przez własne index.js.
import './core/index.js';
import './render/index.js';
import './audio/index.js';
import './world/index.js';
import './player/index.js';
import './weapons/index.js';
import './enemies/index.js';
import './pickups/index.js';
import './input/index.js';
import './progression/index.js';
import './gunfeel/index.js';
import './ui/index.js';
import './game/index.js';

import {DS} from './core/ds.js';
import {opt} from './core/save.js';
import {resize} from './render/renderer.js';
import {applyOpts} from './render/settings.js';
import {loadLevel} from './world/world.js';
import {syncOptUI} from './ui/options.js';
import {updateWallet} from './ui/screens.js';
import {loop} from './game/loop.js';

/* boot */
// Szyldy rysują tekst fontem Bangers na canvasie przy budowie poziomu: czekamy na font (max 1,5 s),
// inaczej wyścig z ładowaniem fontu daje czasem napisy fontem zastępczym.
try{await Promise.race([document.fonts.load('96px Bangers'),new Promise(r=>setTimeout(r,1500))])}catch(e){}
// Poziom: ostatnio wybrany w menu (opt.level), a gdy go nie ma w rejestrze - pierwszy poziom.
loadLevel(DS.levels.has(opt.level)?opt.level:'remiza');
applyOpts();syncOptUI();updateWallet();resize();loop();
