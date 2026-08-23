import fs from 'node:fs';
const app=fs.readFileSync('js/app.js','utf8');
const checks=[
 ['set setup does not clear lineup before dialog', !/function startSetSetup\(\)[\s\S]{0,1500}state\.ownLineup=\{\};state\.oppLineup=\{\}/.test(app)],
 ['lineup editor preloads existing lineup', app.includes("const lineup={...(options.lineup||(side==='own'?state.ownLineup:state.oppLineup)||{})}" )],
 ['lineup editor contains exactly one start-libero selector', app.includes('name="libero1"') && !app.includes('name="libero2"')],
 ['cancel callback supported', app.includes("function modal(title,html,onSubmit,ok='Übernehmen',onCancel=null)") && app.includes('if(runCancel&&cancel)cancel()')],
 ['submit does not trigger cancel', app.includes('closeModal(false);render()')],
 ['set setup uses draft-only transaction', app.includes('{draftOnly:true,lineup:draft.ownLineup') && app.includes('commitSetSetupDraft(draft)')],
 ['libero cannot also be starter', app.includes('Ein ausgewählter Libero darf nicht gleichzeitig Teil der Startaufstellung I–VI sein.')],
 ['set start event stores liberos', app.includes('own_liberos:JSON.stringify') && app.includes('opp_liberos:JSON.stringify')],
 ['all roster liberos stay available for later replacements', !app.includes('const designated=new Set(setLiberosForSide(side))') && app.includes('liberoRows=offCourt.filter(r=>isLiberoRole')],
 ['legacy set-start without libero fields stays compatible', app.includes('if(Array.isArray(fallback))return Array.isArray(v)?v:[...fallback]')],
];
let ok=0;for(const [n,v] of checks){console.log(v?'PASS':'FAIL',n);if(v)ok++}console.log(`${ok}/${checks.length}`);if(ok!==checks.length)process.exit(1);
