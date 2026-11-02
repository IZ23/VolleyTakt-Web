import fs from 'node:fs';
import {describeHistoryBatch,undoEventBatch,restoreEventBatch} from '../js/scouting/history.js';
function ok(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1)}}

const tech={id:'1',event_type:'action',action:'Angriff',player_id:'p12',player_abbreviation:'AB',value:'=',transaction_id:'tx1',event_group:'tx1'};
let d=describeHistoryBatch([tech],'undo');
ok(d.kind==='technique'&&d.action==='Angriff'&&d.value==='='&&d.playerId==='p12','technique description');

const point={id:'2',event_type:'rally_result',action:'Punkt Gegner',rally_winner:'them',transaction_id:'tx2',event_group:'tx2'};
const rot={id:'3',action:'Rotation weiter',rotation_side:'own',rotation_index_before:'4',rotation_index_after:'5',rotation:'R2',transaction_id:'tx2',event_group:'tx2'};
d=describeHistoryBatch([point,rot],'undo');
ok(d.kind==='point'&&d.winner==='them'&&d.rotation?.beforeIndex===4&&d.rotation?.afterIndex===5,'point + rotation description');

const sub={event_type:'substitution',action:'Wechsel',player_out_jersey:'5',player_in_jersey:'9'};
d=describeHistoryBatch([sub],'undo'); ok(d.kind==='substitution'&&d.outJersey==='5'&&d.inJersey==='9','substitution description');
const lib={event_type:'libero_replacement',action:'Libero',player_out_jersey:'4',player_in_jersey:'12'};
d=describeHistoryBatch([lib],'redo'); ok(d.kind==='libero'&&d.mode==='redo','libero description');
const corr={event_type:'score_correction',action:'Spielstandskorrektur',value:'18:17->17:17'};
d=describeHistoryBatch([corr],'undo'); ok(d.kind==='scoreCorrection'&&d.before==='18:17'&&d.after==='17:17','score correction description');

const source=[{id:'a',action:'Annahme',transaction_id:'x'},{id:'b',action:'Punkt wir',transaction_id:'y'},{id:'c',action:'Rotation weiter',transaction_id:'y'}];
const undone=undoEventBatch(source); ok(undone.events.length===1&&undone.removed.length===2,'grouped undo');
const restored=restoreEventBatch(undone.events,undone.removed); ok(restored.length===3&&restored[2].id==='c','redo restore');

const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const runtime=fs.readFileSync(new URL('../js/locales/domains/runtime.js',import.meta.url),'utf8');
ok(html.includes('id="historyFeedback"')&&html.includes('aria-live="polite"')&&!html.includes('tabindex="0" id="historyFeedback"'),'feedback DOM is non-focusable');
ok(css.includes('.history-feedback')&&css.includes('pointer-events:none')&&css.includes('min-height:32px'),'feedback CSS must reserve space and ignore pointer input');
ok(app.includes("showHistoryFeedback(removed,'undo')")&&app.includes("showHistoryFeedback(batch,'redo')"),'undo/redo feedback wiring');
ok(app.includes('setTimeout(()=>{el.classList.remove(\'visible\')')&&app.includes('},3000);'),'3 second timeout');
ok(app.includes('if(redoStack.length)redoStack=[];'),'new event must invalidate redo stack');
for(const key of ['history.undonePrefix','history.restoredPrefix','history.lastEntry','history.point','history.substitution','history.liberoReplacement','history.scoreCorrectionDetail','history.rotationReset','history.rotationRestored']){
  const n=(runtime.match(new RegExp("'"+key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+"'",'g'))||[]).length;
  ok(n===2,`${key} must exist in DE and EN`);
}
console.log('0.4.3.4 history feedback checks passed.');
