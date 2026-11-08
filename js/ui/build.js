// Budowa przebudowanych ekranów w JS (index.html należy do ds-architect): menu główne, wybór misji,
// kolekcja, osiągnięcia, wyjście, pauza. Podekrany Sklep/Kasyno/Skrzynki/Ekwipunek zostają z index.html.
// Importowane jako pierwsze w screens.js, więc DOM jest gotowy przed podpięciem obsługi zdarzeń.
import {$} from '../core/util.js';
import {L} from '../core/i18n.js';
import {h,clear} from './dom.js';
import {langSwitch} from './lang.js';

const wallet=(extra)=>h('div',{class:'wallet'},
  h('span',{class:'zd'},h('b',{class:'w-coins'},'0'),' ZD'),
  h('span',null,L('Klucze: ','Keys: '),h('b',{class:'w-keys'},'0')),
  extra);
const backBtn=()=>h('button',{class:'btn paper sm',type:'button','data-go':'scrMenu'},L('Wróć','Back'));
const topbar=(title,withKeys)=>h('div',{class:'topbar'},h('h2',null,title),
  h('div',{class:'wallet'},h('span',{class:'zd'},h('b',{class:'w-coins'},'0'),' ZD'),withKeys?h('span',null,L('Klucze: ','Keys: '),h('b',{class:'w-keys'},'0')):null,backBtn()));

/* ---- menu główne ---- */
(function buildMenu(){
  const s=$('#scrMenu');clear(s);s.setAttribute('aria-labelledby','menuTitle');
  const btn=(label,attrs,cls)=>h('button',Object.assign({class:'btn'+(cls?' '+cls:''),type:'button'},attrs),label);
  s.append(h('div',{class:'menu'},
    h('div',{class:'title'},
      h('h1',{id:'menuTitle'},'Disco',h('em',null,L('Strzelnica','Shooting Gallery'))),
      h('div',{class:'caption'},L('Godzina 23:14. Remiza w Dolnym Zadupiu. Gang Jednorękiego Bandyty przejął kasyno, a DJ nie przestaje grać. Masz pistolet i rytm.','11:14 PM. The fire station in Dolne Zadupie (Lower Nowheresville). The One-Armed Bandit gang has taken over the casino, and the DJ will not stop playing. You have a pistol and a beat.')),
      h('div',{class:'keysHelp',id:'keysHelp'}),
      h('div',{class:'hsTop3',id:'hsTop3',hidden:true,'aria-label':L('Najlepsi gracze','Top players')}),
      h('div',{id:'touchNote',hidden:true},L('Strzelanie wymaga myszy i klawiatury. Kasyno, skrzynki i sklep działają też na telefonie.','Shooting needs a mouse and keyboard. The casino, crates and shop also work on a phone.'))),
    h('nav',{class:'panel menu-btns','aria-label':L('Menu główne','Main menu')},
      wallet(h('span',null,L('Rekord: fala ','Best: wave '),h('b',{class:'w-best'},'0'))),
      btn(L('Graj','Play'),{id:'mPlay','data-autofocus':''},'play'),
      h('button',{class:'btn setup',id:'mSetup',type:'button','data-go':'scrPlay'},
        h('span',{class:'setup-l'},L('Misja','Mission')),h('b',{id:'mLevelName'},L('Remiza','Fire Station')),h('span',{class:'dotsep','aria-hidden':'true'},'·'),h('b',{id:'mDiffName'},L('Normalny','Normal')),h('span',{class:'setup-r'},L('zmień','change'))),
      h('div',{class:'menu-grid'},
        btn(L('Sklep u Heńka','Heniek\'s Shop'),{'data-go':'scrShop'}),
        btn(L('Kasyno „Złoty Bandyta”','“Golden Bandit” Casino'),{'data-go':'scrCasino'}),
        btn(L('Skrzynki','Crates'),{'data-go':'scrCrates'}),
        btn(L('Ekwipunek i skórki','Inventory & skins'),{'data-go':'scrInv'}),
        btn(L('Kolekcja znajdziek','Loot collection'),{'data-go':'scrCollection'}),
        btn(L('Osiągnięcia','Achievements'),{'data-go':'scrAch'}),
        btn(L('Ranking','Leaderboard'),{'data-go':'scrRanking',class:'btn wide'})),
      h('div',{class:'menu-grid'},
        btn(L('Opcje','Options'),{id:'mOpts'},'paper'),
        btn(L('Wyjście','Exit'),{id:'mExit'},'paper')),
      langSwitch('menuLang'))));
})();

/* ---- wybór misji ---- */
(function buildPlay(){
  const app=$('#app');
  const t=topbar(L('Wybór misji','Choose a mission'),true);t.querySelector('h2').id='playT';
  app.append(h('section',{class:'screen',id:'scrPlay',hidden:true,'aria-labelledby':'playT'},
    h('div',{class:'wrap'},t,
      h('div',{class:'panel setupPanel'},
        h('h3',{id:'lvlH'},L('Poziom','Level')),
        h('div',{class:'cards',id:'levelList',role:'radiogroup','aria-labelledby':'lvlH'}),
        h('h3',{id:'diffH'},L('Trudność','Difficulty')),
        h('div',{class:'cards diff',id:'diffList',role:'radiogroup','aria-labelledby':'diffH'}),
        h('div',{class:'row go'},h('button',{class:'btn red play',id:'pGo',type:'button'},L('Graj','Play')),
          h('span',{class:'note',id:'playNote','aria-live':'polite'}))))));
})();

/* ---- kolekcja znajdziek, osiągnięcia ---- */
(function buildLists(){
  const app=$('#app');
  const t1=topbar(L('Kolekcja znajdziek','Loot collection'),false);t1.querySelector('h2').id='collT';
  const t2=topbar(L('Osiągnięcia','Achievements'),false);t2.querySelector('h2').id='achT';
  app.append(
    h('section',{class:'screen',id:'scrCollection',hidden:true,'aria-labelledby':'collT'},h('div',{class:'wrap'},t1,
      h('div',{class:'panel listPanel'},h('div',{class:'collGrid',id:'collList'})))),
    h('section',{class:'screen',id:'scrAch',hidden:true,'aria-labelledby':'achT'},h('div',{class:'wrap'},t2,
      h('div',{class:'panel listPanel'},h('div',{class:'achSum',id:'achSum','aria-live':'polite'}),h('ul',{class:'achGrid',id:'achList'})))),
    h('section',{class:'screen dim',id:'scrBye',hidden:true},
      h('div',{class:'panel card',role:'dialog','aria-labelledby':'byeT'},h('h2',{id:'byeT'},L('Do zobaczenia!','See you!')),
        h('p',{class:'byeTxt',id:'byeTxt'},L('Gra działa w karcie przeglądarki, więc zamknij kartę, aby wyjść. Postęp zapisuje się automatycznie.','The game runs in a browser tab, so close the tab to leave. Progress is saved automatically.')),
        h('button',{class:'btn red',type:'button','data-go':'scrMenu','data-autofocus':''},L('Wróć do menu','Back to menu'))))
  );
})();

/* ---- ranking (JuicyJuicy) ---- */
(function buildRanking(){
  const t=topbar(L('Ranking','Leaderboard'),false);t.querySelector('h2').id='hsT';
  $('#app').append(h('section',{class:'screen',id:'scrRanking',hidden:true,'aria-labelledby':'hsT'},h('div',{class:'wrap'},t,
    h('div',{class:'panel listPanel hsPanel'},h('p',{class:'note'},L('Wynik = fala × 1000 + zabici × 10 + headshoty × 5. Liczy się najlepszy wynik gracza.','Score = wave × 1000 + kills × 10 + headshots × 5. Only each player\'s best score counts.')),
      h('div',{id:'hsBox','aria-live':'polite'})))));
})();

/* ---- pauza ---- */
(function buildPause(){
  const s=$('#scrPause');clear(s);
  s.append(h('div',{class:'panel card',role:'dialog','aria-modal':'true','aria-labelledby':'pauseT'},
    h('h2',{id:'pauseT'},L('Pauza','Paused')),
    h('div',{class:'caption',style:'text-transform:none'},L('Muzyka gra dalej. Gang czeka.','The music keeps playing. The gang is waiting.')),
    h('button',{class:'btn red',id:'pResume',type:'button','data-autofocus':''},L('Wznów','Resume')),
    h('button',{class:'btn paper',id:'pOpts',type:'button'},L('Opcje','Options')),
    h('button',{class:'btn paper',id:'pKeys',type:'button'},L('Sterowanie i klawisze','Controls & key bindings')),
    h('button',{class:'btn paper',id:'pQuit',type:'button'},L('Wyjdź do menu','Quit to menu')),
    h('div',{class:'perkList',id:'pausePerks',hidden:true}),
    h('small',{class:'hint',id:'pauseHint'})));
})();
