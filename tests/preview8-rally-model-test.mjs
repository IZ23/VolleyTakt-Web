import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js', import.meta.url),'utf8');
const storage=fs.readFileSync(new URL('../js/storage.js', import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css', import.meta.url),'utf8');
const checks=[
 ['four-step state', app.includes("inputStep:'WER'") && app.includes("state.inputStep='WO'")],
 ['frozen player id', app.includes('state.selectedPlayerId=pid') && app.includes('const pid=state.selectedPlayerId')],
 ['separate action zone', app.includes('player_rotation_position:source') && app.includes('action_zone:zone')],
 ['opponent target separate', app.includes('target_zone:target') && app.includes('attack_to:action')],
 ['rally context', app.includes('rally_phase:') && app.includes('transition_no:')],
 ['csv fields', ['player_rotation_position','action_zone','target_zone','rally_phase','transition_no'].every(x=>storage.includes(`'${x}'`))],
 ['step indicator', html.includes('inputStepIndicator')],
 ['outer/inner border', css.includes('.pos.selectedpos') && css.includes('.pos.actionzone')],
 ['help updated', app.includes('Neue Eingabelogik: WER → WAS → WIE → WO') && app.includes('Außenrahmen = WER, Innenrahmen = WO')],
 ['preview version lineage', /0\.3\.(?:0 Preview 9|1 Preview [12])/.test(html) && /TOUR_VERSION='0\.3\.(?:0-p9a|1-p(?:1|2b|2c|2d|2e|2f|2g|2h|2i))'/.test(app)]
];
for(const [name,ok] of checks){if(!ok)throw new Error(`Preview 8 core regression check failed: ${name}`)}
console.log(`Preview 8 core rally/input model retained: OK (${checks.length}/${checks.length})`);
