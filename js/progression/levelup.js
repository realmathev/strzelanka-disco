// Ekran level-up: jednoręki bandyta. Gra jest zapauzowana, każdy zakręt kończy się wygraną perku.
// DOM i style tworzone stąd (bez edycji index.html i css/). Wygląd: komiksowy, na zmiennych CSS z css/main.css.
// Uwaga: kod kasyna (ui/slots.js) jest przywiązany do jego własnego DOM i nie ma wydzielonego API, więc animację bębnów
// (pasek symboli + translateY z cubic-bezier, tykanie, żarówki) odtwarzamy tu na tej samej zasadzie; dźwięki to te same sfx.
import { S } from '../core/state.js';
import { DS } from '../core/ds.js';
import { save, opt, reduced, persist } from '../core/save.js';
import { canvas } from '../render/renderer.js';
import { audioInit } from '../audio/init.js';
import { sfx } from '../audio/sfx.js';
import { CFG } from './config.js';
import { RARITY_NAME, describeTotals } from './catalog.js';
import { rollRarity, pickPerk, layoutFor } from './roll.js';
import { ensure, grantPerk } from './state.js';

const SYM = {
  DIA: { cls: 'kDIA', t: '♦' }, HEART: { cls: 'kHEART', t: '♥' }, BAR: { cls: 'kBAR', t: 'BAR' },
  STAR: { cls: 'kSTAR', t: '★' }, DISCO: { cls: 'kDISCO', t: 'DISCO' }, '7': { cls: 'k7', t: '7' },
};
const FILLER = ['DIA', 'HEART', 'BAR', 'STAR', 'DISCO', '7', 'DIA', 'HEART', 'BAR'];
const rpick = a => a[Math.floor(Math.random() * a.length)];
const symHTML = k => `<div class="lv-sym ${SYM[k].cls}"><span>${SYM[k].t}</span></div>`;

const MSG = {
  common: ['Zwykły, ale szczery.', 'Lepszy rydz niż nic.', 'Gang daje, co ma.', 'Zawsze coś wpada.'],
  rare: ['TRZY! RZADKI PERK!'],
  epic: ['DISCO BONUS! EPICKI PERK!'],
  legend: ['JACKPOT! LEGENDARNY PERK!'],
};

const CSS = `
.lv-root{position:absolute;inset:0;z-index:60;display:flex;align-items:flex-start;justify-content:center;overflow:auto;
  padding:max(14px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 20px max(16px,env(safe-area-inset-left,0px));
  background:rgba(21,17,14,.78);font-family:var(--body);color:var(--ink);--lv-sym:clamp(54px,11vh,84px)}
.lv-root[hidden]{display:none!important}
.lv-rays{position:fixed;inset:-50%;pointer-events:none;opacity:.5;
  background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(247,197,30,.22) 0 7deg,transparent 7deg 18deg);animation:lvSpinRays 60s linear infinite}
.lv-card{position:relative;margin:auto;width:100%;max-width:720px;background:var(--paper);border:4px solid var(--ink);box-shadow:8px 8px 0 var(--ink);
  padding:14px 18px 18px;display:flex;flex-direction:column;gap:12px;animation:lvIn .35s cubic-bezier(.2,1.3,.4,1) both}
.lv-banner{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.lv-banner h2{font-family:var(--display);font-weight:400;font-size:clamp(40px,8vw,64px);line-height:.95;color:var(--yellow);-webkit-text-stroke:2.5px var(--ink);
  text-shadow:4px 4px 0 var(--ink);transform:rotate(-2deg);margin:0;letter-spacing:.03em}
.lv-banner .lv-cap{background:var(--yellow);border:3px solid var(--ink);padding:6px 12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:15px;max-width:30ch;line-height:1.15}
.lv-machine{display:grid;grid-template-columns:minmax(0,1fr) 64px;gap:10px;align-items:end}
.lv-cab{background:var(--red);border:4px solid var(--ink);padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.25)}
.lv-bulbs{display:flex;justify-content:space-between;gap:3px}
.lv-bulbs i{width:12px;height:12px;border-radius:50%;border:2px solid var(--ink);background:#7a5a10}
.lv-bulbs i.on{background:#fff2a8;box-shadow:0 0 10px #ffd84a}
.lv-marquee{font-family:var(--display);font-size:clamp(24px,4.5vw,34px);text-align:center;color:var(--yellow);-webkit-text-stroke:1.5px var(--ink);text-shadow:3px 3px 0 var(--ink);line-height:1}
.lv-reels{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--ink);padding:8px;border:3px solid var(--ink)}
.lv-reel{height:calc(var(--lv-sym)*3);overflow:hidden;background:var(--cream);border:3px solid var(--ink);position:relative}
.lv-strip{will-change:transform}
.lv-sym{height:var(--lv-sym);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:calc(var(--lv-sym)*.62);line-height:1;color:var(--ink);border-bottom:2px dashed rgba(21,17,14,.15)}
.lv-sym.k7{color:var(--red);font-size:calc(var(--lv-sym)*.8);-webkit-text-stroke:2px var(--ink)}
.lv-sym.kDISCO{font-size:calc(var(--lv-sym)*.36);color:var(--teal)}
.lv-sym.kBAR span{font-size:calc(var(--lv-sym)*.4);background:var(--ink);color:var(--yellow);padding:calc(var(--lv-sym)*.08) 14px;line-height:1}
.lv-sym.kSTAR{color:var(--gold);-webkit-text-stroke:2px var(--ink)}
.lv-sym.kHEART{color:var(--red)}
.lv-sym.kDIA{color:var(--rare)}
.lv-payline{position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;background:var(--yellow);box-shadow:0 0 0 2px var(--ink);pointer-events:none}
.lv-msg{font-family:var(--display);font-size:clamp(22px,4vw,30px);text-align:center;min-height:1.3em;color:var(--yellow);-webkit-text-stroke:1px var(--ink);letter-spacing:.03em}
.lv-lever{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:calc(var(--lv-sym)*3 + 60px);width:64px;position:relative}
.lv-lever:focus-visible{outline:3px solid var(--red);outline-offset:3px}
.lv-lever[disabled]{cursor:default}
.lv-arm{width:14px;height:calc(var(--lv-sym)*2);background:var(--ink);position:relative;border-radius:0 0 3px 3px}
.lv-arm::before{content:"";position:absolute;left:50%;top:-26px;width:38px;height:38px;margin-left:-19px;border-radius:50%;border:4px solid var(--ink);background:radial-gradient(circle at 35% 30%,#ff6b6f,var(--red) 60%,#8a1217);box-shadow:3px 3px 0 var(--ink)}
.lv-base{width:46px;height:20px;background:var(--gold);border:4px solid var(--ink);margin-top:-2px;box-shadow:3px 3px 0 var(--ink)}
.lv-lever.pulled .lv-arm{animation:lvPull .55s ease-in-out both}
.lv-pays{display:flex;flex-wrap:wrap;gap:6px;font-size:14px;font-weight:800}
.lv-pays span{border:2px solid var(--ink);padding:2px 8px;background:var(--cream);display:inline-flex;gap:6px;align-items:center}
.lv-pays b{font-family:var(--display);font-weight:400;font-size:17px;letter-spacing:.04em}
.lv-pays .r-common b{color:var(--common)}.lv-pays .r-rare b{color:var(--rare)}.lv-pays .r-epic b{color:var(--epic)}.lv-pays .r-legend b{color:#a8780a}
.lv-pity{font-size:15px;font-weight:700;color:#4d4230}
.lv-result{--rc:var(--common);border:4px solid var(--ink);background:var(--cream);box-shadow:6px 6px 0 var(--rc),6px 6px 0 2px var(--ink);padding:12px 14px;display:grid;gap:4px;animation:lvPop .4s cubic-bezier(.2,1.5,.4,1) both;position:relative}
.lv-result[hidden]{display:none!important}
.lv-result.r-rare{--rc:var(--rare)}.lv-result.r-epic{--rc:var(--epic)}.lv-result.r-legend{--rc:var(--legend)}
.lv-result .lv-rl{justify-self:start;background:var(--rc);color:var(--cream);border:2px solid var(--ink);font-weight:800;text-transform:uppercase;letter-spacing:.06em;font-size:14px;padding:1px 8px}
.lv-result.r-legend .lv-rl{color:var(--ink)}
.lv-result h3{font-family:var(--display);font-weight:400;font-size:clamp(26px,5vw,36px);margin:0;line-height:1;letter-spacing:.03em}
.lv-result p{margin:0;font-size:17px;line-height:1.25;font-weight:600}
.lv-result .lv-tot{font-size:15px;font-weight:800;color:#4d4230}
.lv-pips{display:flex;gap:4px;align-items:center;font-weight:800;font-size:14px}
.lv-pips i{width:14px;height:14px;border:2px solid var(--ink);background:var(--paper-2)}
.lv-pips i.on{background:var(--rc)}
.lv-result.r-legend{animation:lvPop .4s cubic-bezier(.2,1.5,.4,1) both,lvGlow 1.2s ease-in-out .4s infinite alternate}
.lv-actions{display:flex;flex-wrap:wrap;gap:10px}
.lv-actions .lv-btn{font-family:var(--display);letter-spacing:.04em;cursor:pointer;color:var(--ink);background:var(--yellow);border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);padding:8px 24px;font-size:32px;transition:transform .08s,box-shadow .08s}
.lv-actions .lv-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}
.lv-actions .lv-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--ink)}
.lv-actions .lv-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:4px 4px 0 var(--ink)}
.lv-actions .lv-btn.red{background:var(--red);color:var(--cream)}
.lv-actions .lv-btn.teal{background:var(--teal);color:var(--cream)}
.lv-actions .lv-btn:focus-visible{outline:3px solid var(--red);outline-offset:3px}
.lv-owned{display:flex;flex-wrap:wrap;gap:5px;font-size:13px;font-weight:800}
.lv-owned span{border:2px solid var(--ink);border-left-width:6px;background:var(--cream);padding:0 6px}
.lv-owned .r-common{border-left-color:var(--common)}.lv-owned .r-rare{border-left-color:var(--rare)}.lv-owned .r-epic{border-left-color:var(--epic)}.lv-owned .r-legend{border-left-color:var(--legend)}
.lv-owned:empty{display:none}
.lv-side{display:flex;flex-direction:column;gap:12px;min-width:0}
#app.lv-noover #scrOver{display:none!important}
@keyframes lvIn{from{transform:scale(.7) rotate(-3deg);opacity:0}to{transform:none;opacity:1}}
@keyframes lvPop{from{transform:scale(.6) rotate(-4deg);opacity:0}to{transform:none;opacity:1}}
@keyframes lvPull{0%{height:calc(var(--lv-sym)*2)}35%{height:calc(var(--lv-sym)*.7)}100%{height:calc(var(--lv-sym)*2)}}
@keyframes lvGlow{from{filter:drop-shadow(0 0 2px #ffd84a)}to{filter:drop-shadow(0 0 16px #ffd84a)}}
@keyframes lvSpinRays{to{transform:rotate(360deg)}}
@media (max-height:720px) and (min-width:720px){
  .lv-root{--lv-sym:clamp(40px,10vh,64px);padding-top:10px;padding-bottom:10px}
  .lv-card{max-width:940px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:10px 18px;padding:10px 16px 14px}
  .lv-banner{grid-column:1/-1}
  .lv-banner h2{font-size:clamp(34px,7vh,48px)}
  .lv-banner .lv-cap{font-size:14px;padding:4px 10px}
  .lv-machine{align-self:start}
  .lv-lever{height:calc(var(--lv-sym)*3 + 40px)}
  .lv-side{gap:8px}
  .lv-actions .lv-btn{font-size:28px;padding:5px 20px}
}
@media (max-width:560px){.lv-machine{grid-template-columns:minmax(0,1fr) 44px}.lv-lever{width:44px}.lv-card{padding:12px}.lv-actions .lv-btn{font-size:26px;padding:6px 16px}}
@media (prefers-reduced-motion:reduce){.lv-rays,.lv-card,.lv-result,.lv-result.r-legend,.lv-lever.pulled .lv-arm{animation:none}.lv-actions .lv-btn{transition:none}}
`;

let root = null, el = {}, st = null, bulbTimer = 0, bulbStep = 0, bulbParty = 0, tickTimer = 0;
const timers = [];
const later = (fn, ms) => { const id = setTimeout(() => { const i = timers.indexOf(id); if (i >= 0) timers.splice(i, 1); fn(); }, ms); timers.push(id); return id; };

function build() {
  if (root) return;
  const style = document.createElement('style');
  style.id = 'lv-style'; style.textContent = CSS; document.head.appendChild(style);
  root = document.createElement('div');
  root.className = 'lv-root'; root.id = 'lvRoot'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'lvTitle');
  root.innerHTML = `
    <div class="lv-rays"></div>
    <div class="lv-card">
      <div class="lv-banner"><h2 id="lvTitle">POZIOM 2!</h2><div class="lv-cap">Jednoręki Bandyta płaci zawsze. Pociągnij za wajchę.</div></div>
      <div class="lv-machine">
        <div class="lv-cab">
          <div class="lv-bulbs">${'<i></i>'.repeat(18)}</div>
          <div class="lv-marquee">JEDNORĘKI DISCO</div>
          <div class="lv-reels"><div class="lv-reel"><div class="lv-strip"></div></div><div class="lv-reel"><div class="lv-strip"></div></div><div class="lv-reel"><div class="lv-strip"></div></div><div class="lv-payline"></div></div>
          <div class="lv-msg" aria-live="polite"></div>
        </div>
        <button class="lv-lever" type="button" aria-label="Pociągnij za wajchę"><span class="lv-arm"></span><span class="lv-base"></span></button>
      </div>
      <div class="lv-side">
        <div class="lv-pays" aria-label="Tabela rzadkości">
          <span class="r-common"><b>Zwykła</b> mieszanka</span>
          <span class="r-rare"><b>Rzadka</b> ♦♦♦ ♥♥♥ BAR×3</span>
          <span class="r-epic"><b>Epicka</b> ★★★ DISCO×3</span>
          <span class="r-legend"><b>Legenda</b> 7 7 7</span>
        </div>
        <div class="lv-pity"></div>
        <div class="lv-result" hidden></div>
        <div class="lv-actions"><button class="lv-btn red" type="button" id="lvSpin">Zakręć!</button><button class="lv-btn teal" type="button" id="lvTake" hidden>Biorę!</button></div>
        <div class="lv-owned" aria-label="Twoje perki"></div>
      </div>
    </div>`;
  (document.getElementById('app') || document.body).appendChild(root);
  el = {
    title: root.querySelector('#lvTitle'), strips: [...root.querySelectorAll('.lv-strip')], msg: root.querySelector('.lv-msg'),
    lever: root.querySelector('.lv-lever'), pity: root.querySelector('.lv-pity'), result: root.querySelector('.lv-result'),
    spin: root.querySelector('#lvSpin'), take: root.querySelector('#lvTake'), owned: root.querySelector('.lv-owned'),
    bulbs: [...root.querySelectorAll('.lv-bulbs i')],
  };
  el.spin.addEventListener('click', spin);
  el.lever.addEventListener('click', spin);
  el.take.addEventListener('click', close);
}

/* ---------- żarówki ---------- */
function bulbAnim() {
  bulbStep++;
  const K = opt.fx;
  el.bulbs.forEach((b, i) => b.classList.toggle('on',
    bulbParty > 0 ? (K === 0 ? i % 2 === 0 : (i + bulbStep) % 2 === 0)
      : K === 0 ? i % 4 === 0 : (i + Math.floor(bulbStep / (K === 2 ? 1 : 2))) % 4 === 0));
  if (bulbParty > 0) bulbParty--;
}

/* ---------- pity (podpowiedź) ---------- */
function pityText() {
  const pr = ensure(), Y = CFG.pity, p = pr.pity;
  const part = (every, since, name) => {
    if (!(every > 0)) return '';
    const left = every - (since + 1);
    return left <= 0 ? `${name}: gwarantowana w tym zakręcie!` : `${name}: gwarancja za ${left} ${left === 1 ? 'poziom' : left < 5 ? 'poziomy' : 'poziomów'}`;
  };
  return [part(Y.rareEvery, p.sinceRare, 'Rzadka+'), part(Y.epicEvery, p.sinceEpic, 'Epicka+')].filter(Boolean).join(' · ');
}

function ownedChips() {
  const G = S.G; if (!G || !G.perks) return '';
  return Object.keys(G.perks).map(id => { const d = DS.perks.get(id); return d ? `<span class="r-${d.rarity}" title="${d.desc.replace(/"/g, '&quot;')}">${d.name}${G.perks[id] > 1 ? ' ×' + G.perks[id] : ''}</span>` : ''; }).join('');
}

/* ---------- otwieranie / zamykanie ---------- */
export const isOpen = () => !!st;

export function open(level) {
  build();
  const G = S.G;
  if (!G || st) return false;
  audioInit();
  G.paused = true; S.mouseDown = false;
  try { document.exitPointerLock(); } catch (e) {}
  DS.bus.emit('pause', true);
  st = { G, level, spinning: false, done: false };
  el.title.textContent = 'POZIOM ' + level + '!';
  el.msg.textContent = '';
  el.result.hidden = true; el.result.innerHTML = '';
  el.strips.forEach(s => { s.style.transition = 'none'; s.style.transform = 'translateY(0)'; s.innerHTML = [rpick(FILLER), rpick(FILLER), rpick(FILLER)].map(symHTML).join(''); });
  el.spin.hidden = false; el.spin.disabled = false; el.take.hidden = true;
  el.lever.disabled = false; el.lever.classList.remove('pulled');
  el.pity.textContent = pityText();
  el.owned.innerHTML = ownedChips();
  root.hidden = false;
  bulbParty = 0; bulbStep = 0; bulbAnim();
  clearInterval(bulbTimer); bulbTimer = setInterval(bulbAnim, 120);
  sfx('reveal', 0);
  later(() => { if (st && !st.spinning) el.spin.focus(); }, 30);
  return true;
}

function close() {
  const s = st; if (!s || !s.done) return;
  teardown();
  const G = s.G;
  if (S.G === G && S.mode === 'game') {
    G.paused = false;
    if (G.prog) G.prog.delay = 0.3;
    try { const r = canvas.requestPointerLock && canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
    DS.bus.emit('pause', false);
  }
}

function teardown() {
  clearInterval(bulbTimer); clearInterval(tickTimer);
  timers.splice(0).forEach(clearTimeout);
  st = null;
  if (root) { root.hidden = true; }
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();   // Spacja/Enter nie mogą dalej klikać przycisku w grze
}

/** Zamyka ekran bez nagradzania (np. koniec runu w trakcie). */
export function forceClose() {
  if (!st) return;
  const G = st.G;
  teardown();
  if (S.G === G) G.paused = false;
}

/* ---------- losowanie i animacja ---------- */
function decide() {
  const pr = ensure(), G = S.G;
  const roll = rollRarity(pr.pity);
  const picked = pickPerk(roll.rarity, DS.perks.all(), G.perks);
  pr.spins++;
  if (!picked) return { fallback: true, rarity: 'common', why: roll.why, layout: layoutFor('common') };
  return { perk: picked.perk, rarity: picked.rarity, why: roll.why, layout: layoutFor(picked.rarity) };
}

function spin() {
  if (!st || st.spinning || st.done) return;
  audioInit();
  const s = st; s.spinning = true;
  el.spin.disabled = true; el.lever.disabled = true;
  el.pity.textContent = '';
  el.lever.classList.remove('pulled'); void el.lever.offsetWidth; el.lever.classList.add('pulled');
  el.msg.textContent = '';
  const res = decide(); s.res = res;
  const ms = reduced ? CFG.slot.reducedMs : CFG.slot.spinMs;
  el.strips.forEach((strip, i) => {
    const L = 22 + i * 6;
    const arr = [];
    for (let k = 0; k < L - 3; k++) arr.push(rpick(FILLER));
    arr.push(rpick(FILLER), res.layout[i], rpick(FILLER));
    strip.innerHTML = arr.map(symHTML).join('');
    strip.style.transition = 'none'; strip.style.transform = 'translateY(0)'; void strip.offsetWidth;
    const d = ms[i] / 1000;
    strip.style.transition = `transform ${d}s cubic-bezier(.2,.75,.25,1.05)`;
    strip.style.transform = `translateY(${-((arr.length - 3) / arr.length) * 100}%)`;   // % własnej wysokości paska: bez mierzenia px
    later(() => sfx('tick', 600), ms[i]);
  });
  let ticks = 0;
  clearInterval(tickTimer);
  tickTimer = setInterval(() => { sfx('tick', 900 + Math.random() * 500); if (++ticks > (reduced ? 6 : 16)) clearInterval(tickTimer); }, 80);
  later(() => reveal(s), ms[2] + 60);
}

function reveal(s) {
  if (st !== s) return;
  const res = s.res;
  s.spinning = false; s.done = true;
  clearInterval(tickTimer);
  let name, desc, tot = '', stacks = 0, max = 1, rarity = res.rarity;
  if (res.fallback) {
    const bonus = 150 + 25 * s.level;
    save.coins += bonus; if (s.G.earned != null) s.G.earned += bonus; persist();
    name = 'Worek ZD od Bandyty'; desc = `Masz już wszystkie perki, więc automat sypie złotem: +${bonus} ZD.`; tot = '';
  } else {
    const def = res.perk;
    stacks = grantPerk(def.id);
    const pr = ensure();
    pr.history.push({ level: s.level, id: def.id, rarity, stacks, why: res.why });
    name = def.name; desc = def.desc; max = def.max || 1;
    tot = describeTotals(def, stacks);
    DS.bus.emit('perk', { id: def.id, rarity, stacks, level: s.level });
  }
  const msg = rpick(MSG[rarity]);
  el.msg.textContent = msg;
  bulbParty = rarity === 'legend' ? 40 : rarity === 'epic' ? 26 : 14;
  sfx(rarity === 'legend' ? 'jackpot' : 'win');
  if (rarity === 'epic' || rarity === 'legend') later(() => sfx('reveal', rarity === 'legend' ? 5 : 2), 250);
  el.result.className = 'lv-result r-' + rarity;
  const pips = res.fallback ? '' : `<div class="lv-pips" aria-label="Stack ${stacks} z ${max}">${Array.from({ length: max }, (_, i) => `<i class="${i < stacks ? 'on' : ''}"></i>`).join('')}<span>${stacks > 1 ? 'stack ×' + stacks : 'nowy perk'}${max > 1 ? ' (maks. ' + max + ')' : ''}</span></div>`;
  el.result.innerHTML = `<span class="lv-rl">${RARITY_NAME[rarity]}${res.why === 'jackpot' ? ' · jackpot' : res.why.startsWith('pity') ? ' · gwarancja' : ''}</span><h3></h3><p></p>${tot ? '<div class="lv-tot"></div>' : ''}${pips}`;
  el.result.querySelector('h3').textContent = name;
  el.result.querySelector('p').textContent = desc;
  if (tot) el.result.querySelector('.lv-tot').textContent = 'Razem: ' + tot;
  el.result.hidden = false;
  el.owned.innerHTML = ownedChips();
  el.spin.hidden = true; el.take.hidden = false;
  el.take.disabled = true;                                   // krótka blokada: serię klikania w "Zakręć" nie zjemy przypadkiem
  later(() => { if (st === s) { el.take.disabled = false; el.take.focus(); } }, 650);
}
