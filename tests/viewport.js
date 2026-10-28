// Sprawdza przepełnienie poziome na każdym ekranie przy bieżącym viewporcie (ustaw rozmiar przez resize_window i przeładuj stronę).
// Użycie: (0,eval)(await (await fetch('/tests/viewport.js')).text()).then(r=>JSON.stringify(r))  na świeżo załadowanej stronie.
(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const scr=await import('/js/ui/screens.js');const opts=await import('/js/ui/options.js');const {S}=await import('/js/core/state.js');
const W=innerWidth,H=innerHeight,out={viewport:W+'x'+H,metaViewport:!!document.querySelector('meta[name=viewport]'),screens:{}};
const bad=(root)=>{const o=[];for(const el of root.querySelectorAll('*')){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
  // pomiń elementy w przewijanych kontenerach (poziomy scroll wewnętrzny) i dekoracje fixed/absolute poza ekranem
  if(r.right>W+2||r.left<-2){let p=el.parentElement,scroll=false;while(p&&p!==root){const o2=getComputedStyle(p).overflowX;if(o2==='auto'||o2==='scroll'||o2==='hidden'){scroll=true;break}p=p.parentElement}
    if(!scroll)o.push((el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0])+' L'+Math.round(r.left)+' R'+Math.round(r.right))}}return o.slice(0,6)};
const ids=[...document.querySelectorAll('.screen')].map(s=>s.id);
if(S.mode==='warn'){out.warn={hScroll:document.documentElement.scrollWidth-W,over:bad(document.getElementById('scrWarn'))};document.getElementById('warnFull').click();await sleep(200)}
for(const id of ids){if(id==='scrWarn'||id==='scrPause'||id==='scrOver')continue;scr.show(id);await sleep(60);
  const root=document.getElementById(id);out.screens[id]={hScroll:document.documentElement.scrollWidth-W,rootOverflow:root.scrollWidth-root.clientWidth,vScrollable:root.scrollHeight>root.clientHeight,over:bad(root)};
  if(id==='scrOptions'){for(const t of ['gfx','snd','ctl','xh','acc','game']){opts.openOptionsTab(t);await sleep(40);out.screens['opt:'+t]={hScroll:document.documentElement.scrollWidth-W,over:bad(root)}}}
  if(id==='scrShop'){for(const n of ['heniek','zdzichu','halina']){document.querySelector('#shopTabs button[data-npc='+n+']').click();await sleep(40);out.screens['shop:'+n]={hScroll:document.documentElement.scrollWidth-W,over:bad(root)}}}}
scr.show('scrMenu');
return out})()
