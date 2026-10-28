// Ekran przypisania klawiszy (rebind): lista akcji, „Naciśnij klawisz…”, konflikty (zamień / odrzuć),
// reset per akcja i wszystkich, Esc anuluje. Logika: input/bindings.js, zapis: opt.keys.
import {DS} from '../core/ds.js';
import {sfx} from '../audio/sfx.js';
import {GROUPS,isModified} from '../input/actions.js';
import {codeLabel} from '../input/labels.js';
import {tryAssign,resolve,clearSlot,isFixed,MAX_SLOTS} from '../input/bindings.js';
import {h,clear} from './dom.js';

const I=DS.input;
let host=null,listBox=null,statusEl=null,conflictEl=null,listening=null,pending=null,resetArm=false,resetBtn=null;

export function buildControls(parent){
  resetBtn=h('button',{class:'btn paper sm',id:'bindResetAll',type:'button',onclick:onResetAll},'Przywróć wszystkie domyślne');
  statusEl=h('div',{class:'bindStatus',id:'bindStatus',role:'status','aria-live':'polite'});
  conflictEl=h('div',{class:'bindConflict',id:'bindConflict',role:'alertdialog','aria-labelledby':'bindConflictT',hidden:true});
  listBox=h('div',{class:'bindGroups'});
  host=h('div',{class:'binds',id:'binds'},
    h('div',{class:'bindBar'},h('h3',{id:'bindH'},'Przypisanie klawiszy'),resetBtn),
    h('p',{class:'note'},'Kliknij pole, a potem naciśnij klawisz, przycisk myszy albo ruszaj kółkiem. Esc anuluje. Każda akcja ma dwa pola.'),
    statusEl,conflictEl,listBox);
  parent.append(host);
  refreshControls();
  return host;
}

function say(msg){if(statusEl)statusEl.textContent=msg}
const aLabel=id=>{const a=I.get(id);return a?a.label:id};

/** Przebudowuje listę akcji. */
export function refreshControls(){
  if(!listBox)return;
  // zapamiętaj, który element miał fokus, żeby po przebudowie listy klawiaturowicz nie gubił miejsca
  const ae=document.activeElement;let fk=null;
  if(ae&&listBox.contains(ae)){const r=ae.closest('.bind'),cell=ae.closest('.slotCell');
    if(r)fk={a:r.dataset.a,cls:ae.classList.contains('slot')?'slot':ae.classList.contains('x')?'x':'mini',i:cell?[...r.querySelectorAll('.slotCell')].indexOf(cell):0}}
  clear(listBox);
  const conf=I.conflicts(),confIds=new Set();
  for(const c in conf)conf[c].forEach(id=>confIds.add(id));
  for(const g of GROUPS){
    const acts=I.all().filter(a=>a.group===g.id);if(!acts.length)continue;
    const hid='bg-'+g.id;
    listBox.append(h('section',{class:'bindGroup','aria-labelledby':hid},h('h4',{id:hid},g.label),
      h('div',{class:'bindList',role:'list'},acts.map(a=>row(a,confIds.has(a.id))))));
  }
  if(fk){const r=listBox.querySelector(`.bind[data-a="${fk.a}"]`);let t=null;
    if(r){const cell=r.querySelectorAll('.slotCell')[fk.i];t=(cell&&cell.querySelector('.'+fk.cls))||(cell&&cell.querySelector('.slot'))||r.querySelector('.'+fk.cls)||r.querySelector('.slot')}
    if(t)t.focus({preventScroll:true})}
}
function slotCell(a,i){
  const code=a.codes[i],fixed=isFixed(a.id,i),isL=listening&&listening.id===a.id&&listening.slot===i;
  const name=`${a.label}, pole ${i+1}: ${code?codeLabel(code):'nieprzypisane'}`;
  const b=h('button',{class:'slot'+(isL?' listening':'')+(code?'':' empty'),type:'button','data-a':a.id,'data-i':i,
      'aria-label':isL?`${a.label}, pole ${i+1}: naciśnij klawisz`:name+(fixed?' (stałe)':'. Kliknij, aby zmienić'),
      'aria-disabled':fixed?'true':null,onclick:()=>onSlot(a.id,i)},
    isL?'Naciśnij klawisz…':codeLabel(code),fixed?h('small',{class:'lock'},' (stałe)'):null);
  const cell=h('span',{class:'slotCell'},b);
  if(code&&!fixed)cell.append(h('button',{class:'x',type:'button','aria-label':`Wyczyść pole ${i+1}: ${a.label}`,title:'Wyczyść',onclick:()=>{clearSlot(a.id,i);say(`Wyczyszczono pole ${i+1} akcji „${a.label}”.`);afterChange()}},'×'));
  return cell;
}
function row(a,conflict){
  const mod=isModified(a.id);
  return h('div',{class:'bind'+(conflict?' conflict':''),role:'listitem','data-a':a.id},
    h('span',{class:'bname'},a.label,conflict?h('em',{class:'badge'},'konflikt'):null,!a.codes.length?h('em',{class:'badge'},'brak'):null),
    slotCell(a,0),slotCell(a,1),
    h('button',{class:'mini',type:'button',disabled:!mod,'aria-label':`Przywróć domyślne: ${a.label}`,onclick:()=>{I.reset(a.id);say(`Przywrócono domyślne: „${a.label}”.`);afterChange()}},'Reset'));
}
function afterChange(){
  listening=null;pending=null;conflictEl.hidden=true;refreshControls();sfx('tick',1200);
}

/* ---- przypisywanie ---- */
function onSlot(id,slot){
  if(isFixed(id,slot)){say('Esc jest stałym klawiszem pauzy i nie można go zmienić. Drugie pole możesz przypisać dowolnie.');return}
  cancelBindUi(true);
  listening={id,slot};
  refreshControls();
  say(`Naciśnij klawisz lub przycisk myszy dla „${aLabel(id)}” (pole ${slot+1}). Esc anuluje.`);
  const b=listBox.querySelector(`.slot[data-a="${id}"][data-i="${slot}"]`);if(b)b.focus({preventScroll:true});
  I.capture(res=>{
    listening=null;
    if(!res){say('Anulowano.');refreshControls();restoreFocus(id,slot);return}
    const r=tryAssign(id,slot,res.code);
    if(r.conflict){showConflict(id,slot,res.code,r.conflict);return}
    if(r.ok){say(`„${aLabel(id)}”, pole ${slot+1}: ${codeLabel(res.code)}.`);afterChange();restoreFocus(id,slot);return}
    say(r.reason==='reserved'?`Klawisz ${codeLabel(res.code)} jest zarezerwowany i nie można go przypisać.`:'Nie można zmienić tego pola.');
    refreshControls();restoreFocus(id,slot);
  });
}
function restoreFocus(id,slot){const b=listBox&&listBox.querySelector(`.slot[data-a="${id}"][data-i="${slot}"]`);if(b)b.focus({preventScroll:true})}

function showConflict(id,slot,code,others){
  pending={id,slot,code};
  const names=others.map(o=>`„${aLabel(o)}”`).join(', ');
  clear(conflictEl);
  conflictEl.append(
    h('p',{id:'bindConflictT'},`${codeLabel(code)} jest już przypisany do: ${names}. Zamienić?`),
    h('div',{class:'row'},
      h('button',{class:'btn sm',type:'button',id:'bindSwap','data-autofocus':'',onclick:()=>doResolve('swap')},'Zamień'),
      h('button',{class:'btn paper sm',type:'button',onclick:()=>doResolve('cancel')},'Odrzuć')));
  conflictEl.hidden=false;
  say(`Konflikt: ${codeLabel(code)} jest już używany przez ${names}.`);
  refreshControls();
  const s=conflictEl.querySelector('#bindSwap');if(s)s.focus();
}
function doResolve(mode){
  const p=pending;pending=null;conflictEl.hidden=true;if(!p)return;
  const r=resolve(p.id,p.slot,p.code,mode);
  if(r.ok){
    say(`Zamieniono: ${codeLabel(p.code)} → „${aLabel(p.id)}”.`+(r.emptied&&r.emptied.length?` Uwaga: „${r.emptied.map(aLabel).join('”, „')}” nie ma teraz przypisania.`:''));
    afterChange();
  }else{say(r.reason==='fixed'?'Ten klawisz jest stały i nie można go odebrać.':'Odrzucono, bez zmian.');refreshControls()}
  restoreFocus(p.id,p.slot);
}

/** Anuluje trwające przypisywanie / konflikt. Zwraca true, gdy coś było aktywne (Esc nie powinien wtedy wychodzić z ekranu). */
export function cancelBindUi(silent){
  const was=!!(listening||pending);
  if(listening){listening=null}
  I.capture(null);
  if(pending){pending=null;if(conflictEl)conflictEl.hidden=true}
  if(was){if(!silent)say('Anulowano.');refreshControls()}
  return was;
}
function onResetAll(){
  if(!resetArm){resetArm=true;resetBtn.textContent='Na pewno? Kliknij ponownie';setTimeout(()=>{resetArm=false;if(resetBtn)resetBtn.textContent='Przywróć wszystkie domyślne'},3000);return}
  resetArm=false;resetBtn.textContent='Przywróć wszystkie domyślne';I.reset();say('Przywrócono wszystkie domyślne przypisania.');afterChange();
}
