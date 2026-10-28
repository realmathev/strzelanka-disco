// Jednoręki bandyta w kasynie (wirtualne ZD).
import {$,$$,pick} from '../core/util.js';
import {save,opt,reduced,persist} from '../core/save.js';
import {audioInit} from '../audio/init.js';
import {sfx} from '../audio/sfx.js';
/* ============ SLOTS ============ */
const SYMS=[{k:'7',cls:'s7',t:'7',w:3,pay:100},{k:'DISCO',cls:'sDISCO',t:'DISCO',w:5,pay:50},{k:'BAR',cls:'sBAR',t:'BAR',w:8,pay:25},{k:'STAR',cls:'sSTAR',t:'★',w:12,pay:15},{k:'HEART',cls:'sHEART',t:'♥',w:16,pay:10},{k:'DIA',cls:'sDIA',t:'♦',w:20,pay:6}];
const SYM_TOT=SYMS.reduce((a,s)=>a+s.w,0);
function rollSym(){let r=Math.random()*SYM_TOT;for(const s of SYMS){r-=s.w;if(r<=0)return s}return SYMS[5]}
let bet=10,spinning=false,slotsReady=false,visible=[[],[],[]];
function symHTML(s){return `<div class="sym ${s.cls}">${s.t}</div>`}
export function initSlots(){
  if(!slotsReady){slotsReady=true;
    $('#bulbs').innerHTML='<i></i>'.repeat(22);
    $('#paysBody').innerHTML=SYMS.map(s=>`<tr><td style="color:${s.k==='7'?'var(--red)':'inherit'}">${s.t} ${s.t} ${s.t}</td><td>× ${s.pay}</td></tr>`).join('')+`<tr><td>dwa pierwsze</td><td>× 2</td></tr>`;
    $$('.strip').forEach((st,i)=>{visible[i]=[rollSym(),rollSym(),rollSym()];st.innerHTML=visible[i].map(symHTML).join('')});
    $$('#bets button').forEach(b=>b.addEventListener('click',()=>{if(spinning)return;bet=+b.dataset.bet;syncBets();sfx('tick',1200)}));
    $('#spin').addEventListener('click',spin);
    setInterval(bulbAnim,120);
  }
  syncBets();
}
let bulbStep=0,bulbParty=0;
function bulbAnim(){if($('#scrCasino').hidden)return;bulbStep++;const K=opt.fx;const bs=$$('#bulbs i');
  bs.forEach((b,i)=>b.classList.toggle('on',bulbParty>0?(K===0?i%2===0:(i+bulbStep)%2===0):K===0?i%4===0:(i+Math.floor(bulbStep/(K===2?1:2)))%4===0));if(bulbParty>0)bulbParty--}
function syncBets(){$$('#bets button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.bet===bet)));$('#spin').disabled=spinning||save.coins<bet}
function spin(){
  if(spinning)return;if(save.coins<bet){sfx('error');$('#slotMsg').textContent='Za mało ZD. Idź postrzelać.';return}
  audioInit();spinning=true;save.coins-=bet;persist();syncBets();$('#slotMsg').textContent='';
  const res=[rollSym(),rollSym(),rollSym()];
  const symH=$('.sym').getBoundingClientRect().height||80;
  $$('.strip').forEach((st,i)=>{const L=22+i*6;const arr=visible[i].slice();while(arr.length<L-3)arr.push(rollSym());arr.push(rollSym(),res[i],rollSym());
    st.innerHTML=arr.map(symHTML).join('');st.style.transition='none';st.style.transform='translateY(0)';void st.offsetWidth;
    const d=reduced?.4+i*.15:1.1+i*.45;st.style.transition=`transform ${d}s cubic-bezier(.2,.75,.25,1.05)`;st.style.transform=`translateY(${-(arr.length-3)*symH}px)`;
    visible[i]=arr.slice(-3);
    setTimeout(()=>sfx('tick',600),d*1000);
  });
  let ticks=0;const ti=setInterval(()=>{sfx('tick',900+Math.random()*500);if(++ticks>16)clearInterval(ti)},80);
  setTimeout(()=>{spinning=false;
    let win=0,msg='';
    if(res[0].k===res[1].k&&res[1].k===res[2].k){win=bet*res[0].pay;msg=res[0].k==='7'?'JACKPOT! ':res[0].k==='DISCO'?'DISCO BONUS! ':'TRZY! '}
    else if(res[0].k===res[1].k){win=bet*2;msg='Para! '}
    if(win>0){save.coins+=win;persist();$('#slotMsg').textContent=msg+'+'+win+' ZD';bulbParty=win>=bet*25?40:14;sfx(win>=bet*25?'jackpot':'win')}
    else{$('#slotMsg').textContent=pick(['Prawie!','Jeszcze raz?','Bęben był blisko.','Następny na pewno.']);sfx('lose')}
    syncBets();
  },(reduced?.4+2*.15:1.1+2*.45)*1000+60);
}
