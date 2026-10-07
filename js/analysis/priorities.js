import {analyzeOverview,analyzeRotations,analyzeK1K2,analyzeServe,analyzeReception,analyzeSet,analyzeAttack,analyzePlayers} from './basic.js';
import {rallyContext,wonOwn,firstBallSideout} from './rallies.js';
import {actionName,actionSide,isAction,percent} from './domain.js';

const numberPercent=value=>{const n=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(n)?n:null};
const bestWorst=(rows,key,labelKey)=>{const usable=rows.filter(x=>numberPercent(x[key])!==null&&Number(x.rallies||x.n||0)>0).sort((a,b)=>numberPercent(b[key])-numberPercent(a[key]));return {best:usable[0]?{label:usable[0][labelKey],value:usable[0][key]}:null,worst:usable.at(-1)?{label:usable.at(-1)[labelKey],value:usable.at(-1)[key]}:null};};

// Prioritaet A: Spielsteuerung und Phasen. Die bestehenden, getesteten
// Einzelanalysen bleiben die Rechenbasis; hier werden sie nur zusammengefuehrt.
export function analyzePriorityA(events,matches,context={}){
  const overview=analyzeOverview(events,matches,context),rotations=analyzeRotations(events,context),phases=analyzeK1K2(events,context);
  const {rallies,k1,k2}=rallyContext(events,context.actions||[]);
  const bySet=[1,2,3,4,5].map(set=>{const rr=rallies.filter(r=>Number(r.result?.set)===set),s1=rr.filter(r=>r.result?.serving_before==='them'),s2=rr.filter(r=>r.result?.serving_before==='us');return {set,rallies:rr.length,rallyRate:percent(rr.filter(wonOwn).length,rr.length),sideout:percent(s1.filter(wonOwn).length,s1.length),firstBall:percent(s1.filter(firstBallSideout).length,s1.length),breakpoint:percent(s2.filter(wonOwn).length,s2.length)};}).filter(x=>x.rallies);
  return {overview,rotations,phases,bySet,rotationSignal:bestWorst(rotations,'k1Sideout','rotation'),sample:{rallies:rallies.length,k1:k1.length,k2:k2.length}};
}

// Prioritaet B: Wirkung der Technik und der beteiligten Spielerinnen.
export function analyzePriorityB(events,matches,context={}){
  const serve=analyzeServe(events,context),reception=analyzeReception(events,context),sets=analyzeSet(events,context),attacks=analyzeAttack(events,context),players=analyzePlayers(events,context);
  const actions=events.filter(e=>isAction(e,context.actions||[])&&actionSide(e)==='own'),byTechnique={};
  for(const name of context.actions||[]){const rows=actions.filter(e=>actionName(e)===name);byTechnique[name]={actions:rows.length,positive:percent(rows.filter(e=>['+','#'].includes(e.value)).length,rows.length),errors:percent(rows.filter(e=>e.value==='=').length,rows.length)};}
  return {serve,reception,sets,attacks,players,byTechnique,sample:{actions:actions.length},signals:{serve:bestWorst(serve,'breakRate','p'),reception:bestWorst(reception,'sideoutRate','p'),attack:bestWorst(attacks,'efficiency','p')}};
}

export function analyzePriorityView(view,events,matches,context={}){
  return view==='priorityB'?analyzePriorityB(events,matches,context):analyzePriorityA(events,matches,context);
}
