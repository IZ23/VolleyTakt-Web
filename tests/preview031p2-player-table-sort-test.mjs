import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const checks=[
 ['player table state persisted',app.includes("playersTableSort:{key:'abbreviation',direction:'asc'}")],
 ['sortable abbreviation header',app.includes("head('Kürzel','abbreviation')")],
 ['sortable name header',app.includes("head('Name','name')")],
 ['sortable jersey header',app.includes("head('Nr.','jersey')")],
 ['ascending/descending toggle',app.includes("sort.key===key&&sort.direction==='asc'?'desc':'asc'")],
 ['numeric jersey sort',app.includes('Number.POSITIVE_INFINITY')],
 ['roster sorted by abbreviation',app.includes(".sort((a,b)=>coll.compare(String(a.abbreviation||''),String(b.abbreviation||''))")],
 ['sort styling exists',css.includes('.table-sort.active')],
 ['cache bumped',sw.includes('0.3.1-p2i')]
];
let bad=0;for(const [n,ok] of checks){console.log(`${ok?'✓':'✗'} ${n}`);if(!ok)bad++}if(bad)process.exit(1);console.log(`${checks.length}/${checks.length} checks passed`);
