import assert from 'node:assert/strict';
import {automaticPointFor} from '../js/scouting/rally.js';
import {pointAwardAllowed} from '../js/scouting/scoring.js';

assert.equal(automaticPointFor('own','Annahme','='),'them');
assert.equal(automaticPointFor('own','Abwehr','='),'them');
assert.equal(automaticPointFor('own','Zuspiel','='),'them');
assert.equal(automaticPointFor('own','Angriff','='),'them');
assert.equal(automaticPointFor('own','Aufschlag','='),'them');
assert.equal(automaticPointFor('opponent','Annahme','='),'us');
assert.equal(automaticPointFor('own','Aufschlag','#'),'us');
assert.equal(automaticPointFor('own','Angriff','#'),'us');
assert.equal(automaticPointFor('own','Block','#'),'us');
assert.equal(automaticPointFor('own','Annahme','#'),'');
assert.equal(automaticPointFor('own','Abwehr','#'),'');
assert.equal(automaticPointFor('own','Zuspiel','#'),'');

const ready={matchConfigured:true,setReady:true,matchComplete:false,ownLineupReady:true,opponentCapture:false,opponentLineupReady:false};
assert.equal(pointAwardAllowed({...ready,servingSide:'them'}),true);
assert.equal(pointAwardAllowed({...ready,servingSide:'',terminalResult:false}),false);
assert.equal(pointAwardAllowed({...ready,servingSide:'',terminalResult:true}),true);
console.log('RC1 scoring regression checks passed.');
