import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};
for(const model of ['Osmo Action 4','Osmo Action 5 Pro','Osmo Action 6','Osmo 360',
                    'HERO9 Black','HERO10 Black','HERO11 Black','HERO11 Black Mini','HERO12 Black','HERO13 Black']){
  need(app.includes(model),`camera help missing ${model}`);
}
need(app.includes('Action 2')&&app.includes('Osmo Action 3'),'unsupported DJI legacy models not documented');
need(app.includes('LIT HERO')&&app.includes('MAX 2')&&app.includes('MISSION 1'),'extended Open GoPro compatibility not documented');
need(app.includes('Sie wird im normalen Betrieb nicht angezeigt'),'diagnostics behavior missing from help');
need(!app.includes('DJI ist der erste Adapter'),'obsolete camera help remains');
console.log('preview032p2r4-camera-help-test: OK');
