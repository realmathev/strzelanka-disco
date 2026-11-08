// Zbiorczy test języków: node tests/i18n-all.js [port=4204] [--gpu]
// EN: skan resztek polskiego (tests/i18n.js) i przepełnienie poziome (tests/viewport.js) przy 375/768/1280 px; PL: skan kontrolny.
// Wymaga działającego serwera: node tests/serve.js <port>.
const {spawnSync}=require('child_process'),path=require('path');
const port=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'4204';
const gpu=process.argv.includes('--gpu')?['--gpu']:[];
const run=(file,lang,size)=>{
  const r=spawnSync(process.execPath,[path.join(__dirname,'cdp-run.js'),file,port,'--lang='+lang,'--size='+size,...gpu],{encoding:'utf8',timeout:240000});
  try{return JSON.parse((r.stdout||'').slice((r.stdout||'').indexOf('{')).replace(/\nLOGS[\s\S]*$/,''))}catch(e){return {error:(r.stdout||'')+(r.stderr||'')}}
};
let fails=0;const rep=(n,ok,d)=>{console.log((ok?'PASS ':'FAIL ')+n+(d?' '+d:''));if(!ok)fails++};
for(const [lang,size] of [['en','1280x720'],['en','768x1024'],['en','375x740'],['pl','1280x720']]){
  const r=run('i18n.js',lang,size);
  if(r.error){rep('i18n '+lang+' '+size,false,String(r.error).slice(0,300));continue}
  const bad=Object.entries(r).filter(([k,v])=>typeof v==='string'&&v.startsWith('FAIL'));
  rep('i18n '+lang+' '+size,!bad.length,bad.map(b=>b.join('=')).join('; '));
  if(r.leftovers&&r.leftovers.length)console.log('  leftovers:\n   '+r.leftovers.join('\n   '));
}
for(const size of ['375x740','768x1024','1280x720']){
  const r=run('viewport.js','en',size);
  if(r.error){rep('overflow en '+size,false,String(r.error).slice(0,300));continue}
  const issues=[];
  for(const [k,v] of Object.entries(r.screens||{}))if(v.hScroll>0||(v.over&&v.over.length))issues.push(k+':'+(v.over||[]).join('|'));
  if(r.coopHud&&r.coopHud.over&&r.coopHud.over.length)issues.push('coopHud:'+r.coopHud.over.join('|'));
  rep('overflow en '+size,!issues.length,issues.join('; '));
}
process.exit(fails?1:0);
