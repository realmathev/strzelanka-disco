// Nakładka 2D (canvas #fx): napisy komiksowe, hitmarker, winieta, ogłoszenia, kadry przy headshocie.
import {$,$$,clamp,pick} from '../core/util.js';
import {opt} from '../core/save.js';
import {S} from '../core/state.js';
import {canvas,camera} from './renderer.js';

const fx=$('#fx'),fctx=fx.getContext('2d');
const tmpV=new THREE.Vector3();

/** Pływający napis. o: {x,y | world:Vector3, size, life, color, vy, rot, burst}. */
export function addFloater(text,o){const G=S.G;if(!G)return;G.floaters.push(Object.assign({text,t:0,life:.8,size:24,color:'#fff',vy:-30,rot:0,dy:0},o))}
/** Duży napis na środku (+ podpis) i błysk ekranu, jeśli efekty włączone. */
export function announce(text,sub){const G=S.G;if(!G)return;G.announce={text,sub,t:0,life:1.8};if(opt.fx>0)G.flashT=.12}
export function comicText(ctx,text,x,y,size,fill,rot,burst){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);
  ctx.font=`${size}px Bangers, Impact, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  if(burst){const w=ctx.measureText(text).width*.75+size*.6,h=size*1.1;ctx.beginPath();for(let i=0;i<22;i++){const a=i/22*Math.PI*2,r=i%2?1:1.35;ctx.lineTo(Math.cos(a)*w*r,Math.sin(a)*h*r)}ctx.closePath();ctx.fillStyle='#f4e7c5';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#15110e';ctx.stroke()}
  ctx.lineJoin='round';ctx.lineWidth=size*.2;ctx.strokeStyle='#15110e';ctx.strokeText(text,0,0);ctx.fillStyle=fill;ctx.fillText(text,0,0);
  ctx.restore();
}
export function drawFx(dt){
  const dpr=Math.min(devicePixelRatio||1,2),W=fx.clientWidth,H=fx.clientHeight;
  if(fx.width!==Math.round(W*dpr)||fx.height!==Math.round(H*dpr)){fx.width=Math.round(W*dpr);fx.height=Math.round(H*dpr)}
  fctx.setTransform(dpr,0,0,dpr,0,0);fctx.clearRect(0,0,W,H);
  const G=S.G;
  if(!G||S.mode!=='game')return;
  const K=opt.fx;
  // hurt vignette
  if(G.hurtT>0||G.hp<G.maxHp*.3){const a=Math.max(G.hurtT/.4*(K?0.55:.25),G.hp<G.maxHp*.3?(.18+.12*Math.sin(G.time*6))*(K?1:.5):0);
    const gr=fctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7);gr.addColorStop(0,'rgba(211,36,42,0)');gr.addColorStop(1,`rgba(211,36,42,${a})`);fctx.fillStyle=gr;fctx.fillRect(0,0,W,H)}
  if(G.flashT>0&&K>0){fctx.fillStyle=`rgba(255,240,180,${G.flashT*(K===2?2.2:1.2)})`;fctx.fillRect(0,0,W,H)}
  // floaters
  for(const f of G.floaters){f.t+=dt;let x=f.x,y=f.y;
    if(f.world){tmpV.copy(f.world).project(camera);if(tmpV.z>1)continue;x=(tmpV.x+1)/2*W;y=(1-tmpV.y)/2*H}
    f.dy+=f.vy*dt;const k=f.t/f.life,sc=k<.15?.6+k/.15*.4:1;fctx.globalAlpha=k>.7?1-(k-.7)/.3:1;
    comicText(fctx,f.text,x,y+f.dy,f.size*sc,f.color,f.rot,f.burst)}
  fctx.globalAlpha=1;G.floaters=G.floaters.filter(f=>f.t<f.life);
  // hitmarker
  if(G.hitT>0){const s=8+(1-G.hitT/.14)*4;fctx.strokeStyle=G.hitHead?'#d3242a':'#f4e7c5';fctx.lineWidth=3;fctx.beginPath();
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{fctx.moveTo(W/2+a*s,H/2+b*s);fctx.lineTo(W/2+a*(s+8),H/2+b*(s+8))});fctx.stroke()}
  // announcement
  if(G.announce){const a=G.announce;a.t+=dt;const k=a.t/a.life;const sc=k<.12?.4+k/.12*.6:1;const wob=K===2?Math.sin(a.t*30)*.03:0;
    fctx.globalAlpha=k>.8?1-(k-.8)/.2:1;comicText(fctx,a.text,W/2,H*.3,Math.min(W/9,80)*sc,'#ffe14a',-.06+wob,true);
    if(a.sub)comicText(fctx,a.sub,W/2,H*.3+Math.min(W/9,80)*.95,26,'#f4e7c5',0);fctx.globalAlpha=1;if(k>=1)G.announce=null}
}

/* comic panel capture (XIII-style headshot inset) */
const panelEls=$$('#panels canvas');let panelHide=0;
export function capturePanels(){
  const G=S.G;const p=G.panelReq;G.panelReq=null;tmpV.copy(p).project(camera);if(tmpV.z>1)return;
  const cw=canvas.width,ch=canvas.height;const sx=(tmpV.x+1)/2*cw,sy=(1-tmpV.y)/2*ch;
  const sizes=[ch*.7,ch*.34,ch*.14];
  panelEls.forEach((c,i)=>{const g=c.getContext('2d');const h=sizes[i],w=h*4/3;const x=clamp(sx-w/2,0,Math.max(cw-w,0)),y=clamp(sy-h*(i===2?.5:.45),0,Math.max(ch-h,0));
    g.fillStyle='#f4e7c5';g.fillRect(0,0,c.width,c.height);try{g.drawImage(canvas,x,y,w,h,0,0,c.width,c.height)}catch(e){}
    g.fillStyle='rgba(21,17,14,.18)';for(let yy=0;yy<c.height;yy+=4)for(let xx=(yy/4%2)*2;xx<c.width;xx+=4)g.fillRect(xx,yy,1.2,1.2)});
  $('#pc1').textContent=pick(['BLAM!','BANG!','PAF!']);$('#pc2').textContent=pick(['UGH...','AAARGH','OJ...']);$('#pc3').textContent=pick(['KONIEC.','DOBRANOC.','ŁUP.']);
  const el=$('#panels');el.hidden=true;void el.offsetWidth;el.hidden=false;panelHide=2.4;
}
/** Odlicza czas widoczności kadrów (wołane z pętli gry). */
export function tickPanels(dt){if(panelHide>0){panelHide-=dt;if(panelHide<=0)$('#panels').hidden=true}}
