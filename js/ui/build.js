// Budowa przebudowanych ekranów w JS (index.html należy do ds-architect): menu główne, wybór misji,
// kolekcja, osiągnięcia, wyjście, pauza. Podekrany Sklep/Kasyno/Skrzynki/Ekwipunek zostają z index.html.
// Importowane jako pierwsze w screens.js, więc DOM jest gotowy przed podpięciem obsługi zdarzeń.
import {$} from '../core/util.js';
import {h,clear} from './dom.js';

const wallet=(extra)=>h('div',{class:'wallet'},
  h('span',{class:'zd'},h('b',{class:'w-coins'},'0'),' ZD'),
  h('span',null,'Klucze: ',h('b',{class:'w-keys'},'0')),
  extra);
const backBtn=()=>h('button',{class:'btn paper sm',type:'button','data-go':'scrMenu'},'Wróć');
const topbar=(title,withKeys)=>h('div',{class:'topbar'},h('h2',null,title),
  h('div',{class:'wallet'},h('span',{class:'zd'},h('b',{class:'w-coins'},'0'),' ZD'),withKeys?h('span',null,'Klucze: ',h('b',{class:'w-keys'},'0')):null,backBtn()));

/* ---- menu główne ---- */
(function buildMenu(){
  const s=$('#scrMenu');clear(s);s.setAttribute('aria-labelledby','menuTitle');
  const btn=(label,attrs,cls)=>h('button',Object.assign({class:'btn'+(cls?' '+cls:''),type:'button'},attrs),label);
  s.append(h('div',{class:'menu'},
    h('div',{class:'title'},
      h('h1',{id:'menuTitle'},'Disco',h('em',null,'Strzelnica')),
      h('div',{class:'caption'},'Godzina 23:14. Remiza w Dolnym Zadupiu. Gang Jednorękiego Bandyty przejął kasyno, a DJ nie przestaje grać. Masz pistolet i rytm.'),
      h('div',{class:'keysHelp',id:'keysHelp'}),
      h('div',{id:'touchNote',hidden:true},'Strzelanie wymaga myszy i klawiatury. Kasyno, skrzynki i sklep działają też na telefonie.')),
    h('nav',{class:'panel menu-btns','aria-label':'Menu główne'},
      wallet(h('span',null,'Rekord: fala ',h('b',{class:'w-best'},'0'))),
      btn('Graj',{id:'mPlay','data-autofocus':''},'play'),
      h('button',{class:'btn setup',id:'mSetup',type:'button','data-go':'scrPlay'},
        h('span',{class:'setup-l'},'Misja'),h('b',{id:'mLevelName'},'Remiza'),h('span',{class:'dotsep','aria-hidden':'true'},'·'),h('b',{id:'mDiffName'},'Normalny'),h('span',{class:'setup-r'},'zmień')),
      h('div',{class:'menu-grid'},
        btn('Sklep u Heńka',{'data-go':'scrShop'}),
        btn('Kasyno „Złoty Bandyta”',{'data-go':'scrCasino'}),
        btn('Skrzynki',{'data-go':'scrCrates'}),
        btn('Ekwipunek i skórki',{'data-go':'scrInv'}),
        btn('Kolekcja znajdziek',{'data-go':'scrCollection'}),
        btn('Osiągnięcia',{'data-go':'scrAch'})),
      h('div',{class:'menu-grid'},
        btn('Opcje',{id:'mOpts'},'paper'),
        btn('Wyjście',{id:'mExit'},'paper')))));
})();

/* ---- wybór misji ---- */
(function buildPlay(){
  const app=$('#app');
  const t=topbar('Wybór misji',true);t.querySelector('h2').id='playT';
  app.append(h('section',{class:'screen',id:'scrPlay',hidden:true,'aria-labelledby':'playT'},
    h('div',{class:'wrap'},t,
      h('div',{class:'panel setupPanel'},
        h('h3',{id:'lvlH'},'Poziom'),
        h('div',{class:'cards',id:'levelList',role:'radiogroup','aria-labelledby':'lvlH'}),
        h('h3',{id:'diffH'},'Trudność'),
        h('div',{class:'cards diff',id:'diffList',role:'radiogroup','aria-labelledby':'diffH'}),
        h('div',{class:'row go'},h('button',{class:'btn red play',id:'pGo',type:'button'},'Graj'),
          h('span',{class:'note',id:'playNote','aria-live':'polite'}))))));
})();

/* ---- kolekcja znajdziek, osiągnięcia ---- */
(function buildLists(){
  const app=$('#app');
  const t1=topbar('Kolekcja znajdziek',false);t1.querySelector('h2').id='collT';
  const t2=topbar('Osiągnięcia',false);t2.querySelector('h2').id='achT';
  app.append(
    h('section',{class:'screen',id:'scrCollection',hidden:true,'aria-labelledby':'collT'},h('div',{class:'wrap'},t1,
      h('div',{class:'panel listPanel'},h('div',{class:'collGrid',id:'collList'})))),
    h('section',{class:'screen',id:'scrAch',hidden:true,'aria-labelledby':'achT'},h('div',{class:'wrap'},t2,
      h('div',{class:'panel listPanel'},h('div',{class:'achSum',id:'achSum','aria-live':'polite'}),h('ul',{class:'achGrid',id:'achList'})))),
    h('section',{class:'screen dim',id:'scrBye',hidden:true},
      h('div',{class:'panel card',role:'dialog','aria-labelledby':'byeT'},h('h2',{id:'byeT'},'Do zobaczenia!'),
        h('p',{class:'byeTxt',id:'byeTxt'},'Gra działa w karcie przeglądarki, więc zamknij kartę, aby wyjść. Postęp zapisuje się automatycznie.'),
        h('button',{class:'btn red',type:'button','data-go':'scrMenu','data-autofocus':''},'Wróć do menu')))
  );
})();

/* ---- pauza ---- */
(function buildPause(){
  const s=$('#scrPause');clear(s);
  s.append(h('div',{class:'panel card',role:'dialog','aria-modal':'true','aria-labelledby':'pauseT'},
    h('h2',{id:'pauseT'},'Pauza'),
    h('div',{class:'caption',style:'text-transform:none'},'Muzyka gra dalej. Gang czeka.'),
    h('button',{class:'btn red',id:'pResume',type:'button','data-autofocus':''},'Wznów'),
    h('button',{class:'btn paper',id:'pOpts',type:'button'},'Opcje'),
    h('button',{class:'btn paper',id:'pKeys',type:'button'},'Sterowanie i klawisze'),
    h('button',{class:'btn paper',id:'pQuit',type:'button'},'Wyjdź do menu'),
    h('div',{class:'perkList',id:'pausePerks',hidden:true}),
    h('small',{class:'hint',id:'pauseHint'})));
})();
