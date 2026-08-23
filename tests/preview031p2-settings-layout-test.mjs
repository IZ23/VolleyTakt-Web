import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const checks=[
 ['responsive settings wrapper', app.includes('class="settings-scout-grid"')],
 ['checkbox group separated', app.includes('class="settings-scout-options"')],
 ['sort control separated', app.includes('class="settings-player-sort"')],
 ['auto fit by available width', /grid-template-columns:repeat\(auto-fit,minmax\(250px,1fr\)\)/.test(css)],
 ['responsive gap exists', /\.settings-scout-grid\{[\s\S]*gap:clamp\(/.test(css)],
 ['narrow layout stacks', /@media \(max-width:620px\)[\s\S]*\.settings-scout-grid\{grid-template-columns:1fr\}/.test(css)],
 ['sort itself still jersey/abbr/firstname', ['jersey','abbreviation','firstName'].every(x=>app.includes(`value="${x}"`))],
 ['new cache id', sw.includes('0.3.1-p2i') && app.includes('0.3.1-p2i')]
];
let fail=0; for(const [n,ok] of checks){console.log(`${ok?'OK':'FAIL'} ${n}`); if(!ok)fail++;}
console.log(`${checks.length-fail}/${checks.length}`); process.exit(fail?1:0);
