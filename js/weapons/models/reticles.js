// Siatki lunet 2D (canvas) dla ADS przez optykę (ds-weapon-modeler). Bez zależności od Three/DS: `drawReticle(kind, ctx, w, h)`.
// kind: 'pso1' (SVD). Rysuje czarną maskę poza kołem pola widzenia + siatkę. Canvas ma być przezroczysty pod spodem (clearRect robi funkcja).
// Wartości w ułamkach promienia pola widzenia R, więc działa przy każdym rozmiarze okna.
export const RETICLES={pso1:drawPso1};
export function drawReticle(kind,ctx,w,h){
  ctx.clearRect(0,0,w,h);
  const f=RETICLES[kind];if(!f)return false;
  f(ctx,w,h);return true;
}

function drawPso1(ctx,w,h){
  const cx=w/2,cy=h/2,R=Math.min(w,h)*.47,u=R;
  // maska: czarne tło z kołem pola widzenia
  ctx.fillStyle='#000';ctx.beginPath();ctx.rect(0,0,w,h);ctx.arc(cx,cy,R,0,Math.PI*2,true);ctx.fill('evenodd');
  const g=ctx.createRadialGradient(cx,cy,R*.82,cx,cy,R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();ctx.translate(cx,cy);
  ctx.fillStyle='#0a0806';ctx.strokeStyle='#0a0806';ctx.lineCap='butt';
  const rect=(x0,y0,x1,y1)=>ctx.fillRect(x0*u,y0*u,(x1-x0)*u,(y1-y0)*u);
  // pozioma: grube końce, cienka część przy środku; przerwa wokół celownika
  for(const s of [-1,1]){
    rect(s>0?.50:-1.02,-.0075,s>0?1.02:-.50,.0075);
    rect(s>0?.12:-.50,-.0022,s>0?.50:-.12,.0022);
    for(const x of [.2,.3,.4])rect(s*x-.0018,-.016,s*x+.0018,.016);        // poprawki boczne
  }
  // pionowa dolna: gruba na dole, cienka w środku
  rect(-.0075,.50,.0075,1.02);rect(-.0022,.12,.0022,.50);
  // szewron główny (punkt celowania w czubku)
  ctx.lineWidth=.007*u;ctx.beginPath();ctx.moveTo(-.075*u,.075*u);ctx.lineTo(0,0);ctx.lineTo(.075*u,.075*u);ctx.stroke();
  // szewrony zasięgu 500..1000 m (coraz mniejsze) poniżej
  ctx.lineWidth=.004*u;
  for(let i=0;i<6;i++){const y=(.16+i*.065)*u,a=(.06-i*.005)*u;ctx.beginPath();ctx.moveTo(-a,y+a);ctx.lineTo(0,y);ctx.lineTo(a,y+a);ctx.stroke()}
  // dalmierz (lewy dół): linia bazowa, łuk skali i opisy
  ctx.lineWidth=.004*u;ctx.beginPath();ctx.moveTo(-.92*u,.56*u);ctx.lineTo(-.42*u,.56*u);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-.92*u,.56*u);ctx.quadraticCurveTo(-.7*u,.50*u,-.42*u,.22*u);ctx.stroke();
  ctx.font=`${Math.round(.05*u)}px Bangers,Impact,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<5;i++){
    const t=(i+.5)/5,x=(-.92+.5*t)*u,yb=.56*u,yc=(.56-.34*t*t-.12*t)*u;
    ctx.beginPath();ctx.moveTo(x,yb);ctx.lineTo(x,yb-.025*u);ctx.stroke();
    ctx.fillText(String(10-i*2),x,yb+.05*u);
  }
  ctx.restore();
  // obrys pola widzenia
  ctx.strokeStyle='#000';ctx.lineWidth=Math.max(2,R*.012);ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();
}
