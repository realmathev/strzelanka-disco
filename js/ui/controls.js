// Ekran przypisania klawiszy (rebind): lista akcji, „Naciśnij klawisz…”, konflikty (zamień / odrzuć),
// reset per akcja i wszystkich, Esc anuluje. Logika: input/bindings.js, zapis: opt.keys.
import {DS} from '../core/ds.js';
import {L} from '../core/i18n.js';
import {sfx} from '../audio/sfx.js';
import {GROUPS,isModified} from '../input/actions.js';
import {codeLabel} from '../input/labels.js';
import {tryAssign,resolve,clearSlot,isFixed,MAX_SLOTS} from '../input/bindings.js';
import {h,clear} from './dom.js';

const I=DS.input;
let host=null,listBox=null,statusEl=null,conflictEl=null,listening=null,pending=null,resetArm=false,resetBtn=null;

export function buildControls(parent){
  resetBtn=h('button',{class:'btn paper sm',id:'bindResetAll',type:'button',onclick:onResetAll},L('Przywróć wszystkie domyślne','Reset all to defaults'));
  statusEl=h('div',{class:'bindStatus',id:'bindStatus',role:'status','aria-live':'polite'});
  conflictEl=h('div',{class:'bindConflict',id:'bindConflict',role:'alertdialog','aria-labelledby':'bindConflictT',hidden:true});
  listBox=h('div',{class:'bindGroups'});
  host=h('div',{class:'binds',id:'binds'},
    h('div',{class:'bindBar'},h('h3',{id:'bindH'},L('Przypisanie klawiszy','Key bindings')),resetBtn),
    h('p',{class:'note'},L('Kliknij pole, a potem naciśnij klawisz, przycisk myszy albo ruszaj kółkiem. Esc anuluje. Każda akcja ma dwa pola.','Click a slot, then press a key, a mouse button or scroll the wheel. Esc cancels. Every action has two slots.')),
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
  const name=L(`${a.label}, pole ${i+1}: ${code?codeLabel(code):'nieprzypisane'}`,`${a.label}, slot ${i+1}: ${code?codeLabel(code):'unassigned'}`);
  const b=h('button',{class:'slot'+(isL?' listening':'')+(code?'':' empty'),type:'button','data-a':a.id,'data-i':i,
      'aria-label':isL?L(`${a.label}, pole ${i+1}: naciśnij klawisz`,`${a.label}, slot ${i+1}: press a key`):name+(fixed?L(' (stałe)',' (fixed)'):L('. Kliknij, aby zmienić','. Click to change')),
      'aria-disabled':fixed?'true':null,onclick:()=>onSlot(a.id,i)},
    isL?L('Naciśnij klawisz…','Press a key…'):codeLabel(code),fixed?h('small',{class:'lock'},L(' (stałe)',' (fixed)')):null);
  const cell=h('span',{class:'slotCell'},b);
  if(code&&!fixed)cell.append(h('button',{class:'x',type:'button','aria-label':L(`Wyczyść pole ${i+1}: ${a.label}`,`Clear slot ${i+1}: ${a.label}`),title:L('Wyczyść','Clear'),onclick:()=>{clearSlot(a.id,i);say(L(`Wyczyszczono pole ${i+1} akcji „${a.label}”.`,`Cleared slot ${i+1} of “${a.label}”.`));afterChange()}},'×'));
  return cell;
}
function row(a,conflict){
  const mod=isModified(a.id);
  return h('div',{class:'bind'+(conflict?' conflict':''),role:'listitem','data-a':a.id},
    h('span',{class:'bname'},a.label,conflict?h('em',{class:'badge'},L('konflikt','conflict')):null,!a.codes.length?h('em',{class:'badge'},L('brak','none')):null),
    slotCell(a,0),slotCell(a,1),
    h('button',{class:'mini',type:'button',disabled:!mod,'aria-label':L(`Przywróć domyślne: ${a.label}`,`Restore default: ${a.label}`),onclick:()=>{I.reset(a.id);say(L(`Przywrócono domyślne: „${a.label}”.`,`Restored default: “${a.label}”.`));afterChange()}},'Reset'));
}
function afterChange(){
  listening=null;pending=null;conflictEl.hidden=true;refreshControls();sfx('tick',1200);
}

/* ---- przypisywanie ---- */
function onSlot(id,slot){
  if(isFixed(id,slot)){say(L('Esc jest stałym klawiszem pauzy i nie można go zmienić. Drugie pole możesz przypisać dowolnie.','Esc is the fixed pause key and cannot be changed. You can bind the other slot freely.'));return}
  cancelBindUi(true);
  listening={id,slot};
  refreshControls();
  say(L(`Naciśnij klawisz lub przycisk myszy dla „${aLabel(id)}” (pole ${slot+1}). Esc anuluje.`,`Press a key or mouse button for “${aLabel(id)}” (slot ${slot+1}). Esc cancels.`));
  const b=listBox.querySelector(`.slot[data-a="${id}"][data-i="${slot}"]`);if(b)b.focus({preventScroll:true});
  I.capture(res=>{
    listening=null;
    if(!res){say(L('Anulowano.','Cancelled.'));refreshControls();restoreFocus(id,slot);return}
    const r=tryAssign(id,slot,res.code);
    if(r.conflict){showConflict(id,slot,res.code,r.conflict);return}
    if(r.ok){say(`“${aLabel(id)}”, ${L('pole','slot')} ${slot+1}: ${codeLabel(res.code)}.`);afterChange();restoreFocus(id,slot);return}
    say(r.reason==='reserved'?L(`Klawisz ${codeLabel(res.code)} jest zarezerwowany i nie można go przypisać.`,`The ${codeLabel(res.code)} key is reserved and cannot be assigned.`):L('Nie można zmienić tego pola.','This slot cannot be changed.'));
    refreshControls();restoreFocus(id,slot);
  });
}
function restoreFocus(id,slot){const b=listBox&&listBox.querySelector(`.slot[data-a="${id}"][data-i="${slot}"]`);if(b)b.focus({preventScroll:true})}

function showConflict(id,slot,code,others){
  pending={id,slot,code};
  const names=others.map(o=>`“${aLabel(o)}”`).join(', ');
  clear(conflictEl);
  conflictEl.append(
    h('p',{id:'bindConflictT'},L(`${codeLabel(code)} jest już przypisany do: ${names}. Zamienić?`,`${codeLabel(code)} is already bound to: ${names}. Swap?`)),
    h('div',{class:'row'},
      h('button',{class:'btn sm',type:'button',id:'bindSwap','data-autofocus':'',onclick:()=>doResolve('swap')},L('Zamień','Swap')),
      h('button',{class:'btn paper sm',type:'button',onclick:()=>doResolve('cancel')},L('Odrzuć','Reject'))));
  conflictEl.hidden=false;
  say(L(`Konflikt: ${codeLabel(code)} jest już używany przez ${names}.`,`Conflict: ${codeLabel(code)} is already used by ${names}.`));
  refreshControls();
  const s=conflictEl.querySelector('#bindSwap');if(s)s.focus();
}
function doResolve(mode){
  const p=pending;pending=null;conflictEl.hidden=true;if(!p)return;
  const r=resolve(p.id,p.slot,p.code,mode);
  if(r.ok){
    say(L(`Zamieniono: ${codeLabel(p.code)} → „${aLabel(p.id)}”.`,`Swapped: ${codeLabel(p.code)} → “${aLabel(p.id)}”.`)+(r.emptied&&r.emptied.length?L(` Uwaga: „${r.emptied.map(aLabel).join('”, „')}” nie ma teraz przypisania.`,` Note: “${r.emptied.map(aLabel).join('”, “')}” is now unbound.`):''));
    afterChange();
  }else{say(r.reason==='fixed'?L('Ten klawisz jest stały i nie można go odebrać.','This key is fixed and cannot be taken away.'):L('Odrzucono, bez zmian.','Rejected, nothing changed.'));refreshControls()}
  restoreFocus(p.id,p.slot);
}

/** Anuluje trwające przypisywanie / konflikt. Zwraca true, gdy coś było aktywne (Esc nie powinien wtedy wychodzić z ekranu). */
export function cancelBindUi(silent){
  const was=!!(listening||pending);
  if(listening){listening=null}
  I.capture(null);
  if(pending){pending=null;if(conflictEl)conflictEl.hidden=true}
  if(was){if(!silent)say(L('Anulowano.','Cancelled.'));refreshControls()}
  return was;
}
function onResetAll(){
  if(!resetArm){resetArm=true;resetBtn.textContent=L('Na pewno? Kliknij ponownie','Sure? Click again');setTimeout(()=>{resetArm=false;if(resetBtn)resetBtn.textContent=L('Przywróć wszystkie domyślne','Reset all to defaults')},3000);return}
  resetArm=false;resetBtn.textContent=L('Przywróć wszystkie domyślne','Reset all to defaults');I.reset();say(L('Przywrócono wszystkie domyślne przypisania.','All bindings restored to defaults.'));afterChange();
}
