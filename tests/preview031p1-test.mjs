import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../js/storage.js',import.meta.url),'utf8');
const en=fs.readFileSync(new URL('../js/locales/en.js',import.meta.url),'utf8');
const checks=[
 ['version',/0\.3\.1 Preview [12]/.test(html)&&/TOUR_VERSION='0\.3\.1-p(?:1|2b|2c|2d|2e|2f|2g|2h|2i)'/.test(app)],
 ['five step workflow',app.includes("labels=['WER','WAS','WIE','WO','WOHIN']")&&html.includes('<span>WOHIN</span>')],
 ['basic five ratings',app.includes("basic_5:['=','-','0','+','#']")],
 ['datavolley ratings',app.includes("datavolley_6:['=','-','!','/','+','#']")],
 ['error auto point',app.includes("if(quality==='=')return side==='own'?'them':'us'")],
 ['hash skill-specific',app.includes("quality==='#'&&['Aufschlag','Angriff','Block'].includes(action)")],
 ['serve preset',app.includes("state.selectedPlayerPos=1")&&app.includes("state.pendingAction='Aufschlag'")&&app.includes('autoServePreset=true')],
 ['serve techniques',app.includes("['jump_float','Jump Float']")&&app.includes("['underhand','von unten']")&&app.includes("['standing_overhand','Standaufschlag']")],
 ['unified serve field',storage.includes("'serve_technique'")&&app.includes("serve_technique:action==='Aufschlag'?state.serveTechnique:''")],
 ['English serve labels',en.includes("'von unten':'Underhand'")&&en.includes("'Standaufschlag':'Standing Overhand'")],
 ['quality help',html.includes('id="qualityMeaning"')&&app.includes('function qualityMeaning(q)')],
 ['timestamps retained',storage.includes("'action_start_seconds'")&&storage.includes("'action_end_seconds'")]
];

checks.push(['no profile-specific sizing state',!app.includes("quality-simple")&&!app.includes("quality-detailed")]);
checks.push(['one shared responsive technique sizing',css.includes('.control-panel .technique-grid button')&&!css.includes('.control-panel.quality-simple .technique-grid button')&&!css.includes('.control-panel.quality-detailed .technique-grid button')]);
checks.push(['one shared responsive quality sizing',css.includes('.control-panel .quality-stack button')&&!css.includes('.control-panel.quality-simple .quality-stack button')&&!css.includes('.control-panel.quality-detailed .quality-stack button')]);
checks.push(['one shared readable quality legend',css.includes('.control-panel .quality-meaning')&&!css.includes('.control-panel.quality-simple .quality-meaning')&&!css.includes('.control-panel.quality-detailed .quality-meaning')]);
checks.push(['detailed content layout only',css.includes('.quality-stack.detailed')]);

for(const [name,ok] of checks){if(!ok)throw new Error(`0.3.1 Preview 1 check failed: ${name}`)}
console.log(`0.3.1 Preview 1: OK (${checks.length}/${checks.length})`);
