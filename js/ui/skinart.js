// Ikona broni w SVG (karty skórek, skrzynki).
let svgN=0;
export function gunSVG(s){const id='g'+(svgN++);
  const fill1=s.fx==='rainbow'?`url(#${id})`:s.c1;
  const defs=s.fx==='rainbow'?`<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#ff2b6a"/><stop offset=".25" stop-color="#ffd84a"/><stop offset=".5" stop-color="#43f0a0"/><stop offset=".75" stop-color="#43a8ff"/><stop offset="1" stop-color="#c04aff"/></linearGradient></defs>`:'';
  return `<svg viewBox="0 0 120 74" aria-hidden="true">${defs}<g stroke="#15110e" stroke-width="3" stroke-linejoin="round"><path d="M8 14 H108 V32 H66 L60 38 V42 H50 L56 68 H32 L26 42 V32 H8Z" fill="${s.c2}"/><rect x="8" y="10" width="100" height="16" fill="${fill1}"/><rect x="100" y="14" width="10" height="6" fill="#15110e"/><path d="M50 42 Q46 52 40 52" fill="none"/></g>${s.fx==='glow'||s.fx==='pulse'||s.fx==='gold'?'<g stroke="#fff" stroke-width="2" opacity=".8"><path d="M16 14 l6 -6"/><path d="M90 30 l6 -6"/></g>':''}</svg>`}
