// Statyczne teksty z index.html: po polsku zostają jak są, w trybie angielskim są podmieniane przy starcie
// (węzły tekstowe dopasowane po przyciętej treści + wybrane atrybuty aria-label). Importowane PIERWSZE w screens.js,
// zanim build.js przebuduje menu/opcje/pauzę (te budują teksty same przez L()).
import {lang} from '../core/i18n.js';

const T=[
['Widok gry','Game view'],['KONIEC','THE END'],
['Fala 1','Wave 1'],['Wrogowie: 0','Enemies: 0'],['Klucze: 0','Keys: 0'],['Apteczki: 0 [H]','Medkits: 0 [H]'],['Pistolet','Pistol'],['Przeładowanie','Reloading'],
['Ostrzeżenie o epilepsji fotogennej','Photosensitive epilepsy warning'],
['U niewielkiego odsetka osób migające światła, błyski i szybko zmieniające się wzory mogą wywołać napad padaczkowy, także u osób, które nigdy wcześniej nie miały napadu.','In a small percentage of people, flashing lights, flashes and rapidly changing patterns can trigger an epileptic seizure, even in people who have never had one before.'],
['Ta gra zawiera błyski wystrzałów, migające światła automatów, szybkie zmiany kolorów i wstrząsy ekranu. Jeśli poczujesz zawroty głowy, zaburzenia widzenia, drganie mięśni, dezorientację albo utratę świadomości, natychmiast przerwij grę i skontaktuj się z lekarzem.','This game contains muzzle flashes, flickering slot machine lights, rapid colour changes and screen shake. If you feel dizzy or notice vision problems, muscle twitching, disorientation or loss of awareness, stop playing immediately and see a doctor.'],
['Graj w dobrze oświetlonym pomieszczeniu, siedź z dala od ekranu i rób przerwy co godzinę.','Play in a well-lit room, sit away from the screen and take a break every hour.'],
['Pełne efekty','Full effects'],['Ogranicz błyski','Reduce flashes'],
['Poziom efektów zmienisz w każdej chwili w Opcjach. Kliknięcie włącza dźwięk.','You can change the effects level at any time in Options. Clicking turns the sound on.'],
['Opcje','Options'],['Wróć','Back'],
['Bazar pod remizą','Bazaar by the Fire Station'],['Klucze:','Keys:'],
['Pan Heniek · sklep','Mr. Heniek · shop'],['Zdzichu Spluwa · broń','Zdzichu Spluwa · guns'],['Siostra Halina · medyk','Sister Halina · medic'],
['Kasyno „Złoty Bandyta”','“Golden Bandit” Casino'],['JEDNORĘKI DISCO','ONE-ARMED DISCO'],['Zakręć','Spin'],['Tabela wygranych','Payouts'],
['Dwa takie same symbole na pierwszych bębnach zwracają 2× stawki. Gra używa wyłącznie wirtualnych złotówek disco (ZD), zarobionych w strzelaninie. Nie da się tu wpłacić ani wypłacić prawdziwych pieniędzy.','Two matching symbols on the first reels pay 2× your bet. The game uses only virtual disco zlotys (ZD) earned in the shootout. You cannot deposit or withdraw real money here.'],
['Skrzynki','Crates'],['Skrzynia Remizowa','Fire Station Crate'],['REMIZA','STATION'],['Skrzynia Weselna','Wedding Crate'],['WESELE','WEDDING'],
['Zwykła 70%','Common 70%'],['Rzadka 22%','Rare 22%'],['Epicka 7%','Epic 7%'],['Legenda 1%','Legend 1%'],
['Zwykła 40%','Common 40%'],['Rzadka 35%','Rare 35%'],['Epicka 19%','Epic 19%'],['Legenda 6%','Legend 6%'],
['Otwórz · 1 klucz','Open · 1 key'],['Otwórz · 2 klucze','Open · 2 keys'],
['Klucze kupisz u Pana Heńka. Wypadają też z wrogów i za bossa.','Buy keys from Mr. Heniek. They also drop from enemies and bosses.'],
['Ekwipunek','Inventory'],
['Pauza','Paused'],['Muzyka gra dalej. Gang czeka.','The music keeps playing. The gang is waiting.'],['Wznów','Resume'],['Wyjdź do menu','Quit to menu'],
['Leżysz.','You\'re down.'],['Użyj Drugiej Szansy','Use Second Chance'],['Jeszcze raz','Try again'],['Menu','Menu'],
];
const MAP=new Map(T);
export const staticT=s=>MAP.get(s);

if(lang==='en'){document.title='Disco Shooter';
  const w=document.createTreeWalker(document.getElementById('app'),NodeFilter.SHOW_TEXT);
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  for(const n of nodes){
    const t=n.nodeValue.trim();if(!t)continue;
    const e=MAP.get(t);if(e)n.nodeValue=n.nodeValue.replace(t,e);
  }
  for(const el of document.querySelectorAll('#app [aria-label]')){const e=MAP.get(el.getAttribute('aria-label'));if(e)el.setAttribute('aria-label',e)}
}

