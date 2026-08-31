import fs from 'node:fs';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const need=(v,m)=>{if(!v)throw new Error(m)};

const nm=app.slice(app.indexOf('function newMatchFromLibrary()'),app.indexOf('function videoStorageLabel'));
need(nm.includes("matchId:newId('match')"),'new match must get matchId immediately');
need(nm.includes('persist();'),'new match must be persisted immediately');
need(nm.includes("archiveCurrentMatch(state.matchComplete?'ended':'interrupted')"),'previous match must be archived before new match');

need(app.includes('data-lib-action="video"'),'library video action missing');
need(app.includes("if(action==='video')drawLibraryVideoAssignments(id)"),'library video action not wired');
need(app.includes('function drawLibraryVideoAssignments(matchId)'), 'library video drawer missing');
need(app.includes('function editLibraryVideoAssignment(matchId'), 'library video editor missing');
need(app.includes('function saveLibraryVideoSnapshot(snapshot)'), 'library video persistence missing');
need(app.includes('syncStoredMatch(next,settings.sync)'), 'library video cloud sync missing');
need(app.includes('Das Spiel muss dafür nicht fortgesetzt werden.'),'direct library video editing explanation missing');
need(css.includes('repeat(4,minmax(0,1fr))'),'four-action library layout missing');

console.log('preview032p2r3-library-video-test: OK');
