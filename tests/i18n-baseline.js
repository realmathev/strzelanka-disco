// Generuje tests/i18n-baseline.json: wszystkie literały '...' z plików treści w commicie sprzed tłumaczenia (8e4f02d).
// tests/i18n-content.js sprawdza, że polskie teksty rejestrów (tryb PL) są dokładnie tymi literałami (polski bez zmian).
// node tests/i18n-baseline.js [commit=8e4f02d]
const {execSync}=require('child_process'),fs=require('fs'),path=require('path');
const commit=process.argv[2]||'8e4f02d',root=path.resolve(__dirname,'..');
const files=execSync(`git ls-tree -r --name-only ${commit} js/weapons js/progression js/pickups js/enemies js/world/levels`,{cwd:root,encoding:'utf8'})
  .split('\n').filter(f=>/\.js$/.test(f)&&!/selftest/.test(f));
const set=new Set();
for(const f of files){
  const src=execSync(`git show ${commit}:${f}`,{cwd:root,encoding:'utf8',maxBuffer:1<<26});
  for(const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g))set.add(m[1].replace(/\\(.)/g,'$1'));
}
const out={commit,files:files.length,strings:[...set].filter(s=>/[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(s)).sort()};
fs.writeFileSync(path.join(__dirname,'i18n-baseline.json'),JSON.stringify(out));
console.log('baseline',commit,out.files,'files',out.strings.length,'strings');
