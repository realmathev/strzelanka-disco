// Mały konstruktor DOM dla ekranów budowanych w JS (index.html należy do ds-architect).
// h('button',{class:'btn',onclick:fn,'aria-label':'..'},'tekst',węzeł)
export function h(tag,props,...kids){
  const el=document.createElement(tag);
  if(props)for(const k in props){
    const v=props[k];if(v==null||v===false)continue;
    if(k==='class')el.className=v;
    else if(k==='text')el.textContent=v;
    else if(k==='html')el.innerHTML=v;
    else if(k.startsWith('on')&&typeof v==='function')el.addEventListener(k.slice(2),v);
    else if(k in el&&k!=='list'&&k!=='type'&&typeof v!=='object'&&!k.includes('-'))el[k]=v;
    else el.setAttribute(k,v===true?'':String(v));
  }
  add(el,kids);return el;
}
function add(el,kids){for(const c of kids){if(c==null||c===false)continue;if(Array.isArray(c))add(el,c);else el.append(c.nodeType?c:document.createTextNode(String(c)))}}
/** Opróżnia węzeł. */
export function clear(el){while(el.firstChild)el.removeChild(el.firstChild);return el}
