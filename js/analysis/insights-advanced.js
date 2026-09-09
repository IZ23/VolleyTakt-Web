// VolleyTakt Live · ANALYSIS-INSIGHT2
// Multi-step hypothesis generator based on action chains and relative context.
import {buildContextReport,contextRow} from './context.js';

const fmt=v=>Number.isFinite(v)?`${v.toFixed(1).replace('.',',')} %`:'–';
const conf=n=>n>=18?'high':n>=8?'medium':n>=4?'low':'insufficient';
const insight=(kind,finding,context,next,n)=>({kind,confidence:conf(n),sample:n,finding,context,next});

export function advancedInsightsFor(view,result,{events=[],actions=[]}={}){
  const report=buildContextReport(events,{actions}), out=[];
  const totalContexts=report.chains.length;
  const add=(...args)=>out.push(insight(...args));

  if(view==='rotations'){
    const rows=(result||[]).filter(r=>Number(r.rallies)>0).sort((a,b)=>Number(a.points||0)-Number(b.points||0));
    const target=rows[0];if(!target)return [];
    const ctx=contextRow(report,'byRotation',target.rotation), s=ctx?.summary, team=report.overall;
    if(!ctx||ctx.rows.length<4)return [insight('uncertain',`${target.rotation} ist auffällig, aber die Kontextkette ist noch klein.`,`Nur ${ctx?.rows?.length||0} Rallys können für die vertiefte Kettenanalyse verwendet werden.`,'Weitere Rallys erfassen.',ctx?.rows?.length||0)];
    if(s.receptionPositiveRate!=null&&team.receptionPositiveRate!=null&&s.receptionPositiveRate<=team.receptionPositiveRate-10){
      add('warning',`${target.rotation}: Die Daten deuten auf die Annahme als wesentlichen Belastungsfaktor.`,`Positive Annahme ${fmt(s.receptionPositiveRate)} gegenüber ${fmt(team.receptionPositiveRate)} im Gesamtbild; First-Ball ${fmt(s.firstBallRate)}.`,'Annahmen dieser Rotation nach Spielerin und Zielzone öffnen; anschließend Zuspielverteilung nach schwacher Annahme prüfen.',ctx.rows.length);
    }else if(s.firstBallRate!=null&&team.firstBallRate!=null&&s.firstBallRate<=team.firstBallRate-10){
      add('warning',`${target.rotation}: Die Annahme erklärt die Schwäche nicht vollständig.`,`Positive Annahme ist nicht deutlich schlechter als im Team, der First-Ball-Sideout liegt jedoch niedriger (${fmt(s.firstBallRate)}).`,'Zuspielauswahl, Mitte-Einbindung und Effizienz des ersten Angriffs untersuchen.',ctx.rows.length);
    }else{
      add('neutral',`${target.rotation}: Kein einzelner erster Ballkontakt erklärt die Rallybilanz eindeutig.`,`Annahme ${fmt(s.receptionPositiveRate)}, First Ball ${fmt(s.firstBallRate)}, Angriff-Kill ${fmt(s.attackKillRate)}.`,'K1, K2 und K3 getrennt sowie Spielerinnenkonstellation betrachten.',ctx.rows.length);
    }
    const k3=Number.parseFloat(String(target.k3WinRate||'').replace(',','.'));
    if(Number(target.k3Count||0)>=4&&Number.isFinite(k3)&&k3<35) add('warning',`${target.rotation}: Auch die Transition ist auffällig.`,`K3-Erfolg ${target.k3WinRate} bei ${target.k3Count} Transitionen.`,'Block-/Abwehrqualität und Gegenangriff dieser Rotation prüfen.',target.k3Count);
  }

  if(view==='firstball'){
    const t=result?.total||{}, n=Number(t.rallies||0);
    if(!n)return [];
    add(n<4?'uncertain':'neutral','First-Ball-Sideout wird über die vollständige K1-Erstkontaktkette eingeordnet.',`Annahme +/# ${t.recPositive||'–'} → erster Angriff # ${t.attackKill||'–'} → First Ball ${t.firstBall||'–'}.`,'Rotationen und Annahmequalitäten mit der stärksten Abweichung vergleichen.',n);
    const weak=[...(result.byRotation||[])].filter(x=>x.rallies>=4).sort((a,b)=>parseFloat(a.firstBall)-parseFloat(b.firstBall))[0];
    if(weak)add('warning',`${weak.rotation} weist im First-Ball-Sideout den schwächsten belastbaren Wert auf.`,`First Ball ${weak.firstBall}, Annahme +/# ${weak.recPositive}, erster Angriff # ${weak.attackKill}.`,'Prüfen, ob Annahme oder die anschließende Zuspiel-/Angriffsentscheidung stärker abweicht.',weak.rallies);
  }

  if(view==='k3'){
    const t=result?.total||{},n=Number(t.n||0);
    if(!n)return [insight('uncertain','Noch keine vollständigen K3-Transitionen erkennbar.','K3 benötigt gegnerischen Angriff → eigenen Block/Abwehrkontakt → eigenen Gegenangriff.','Detaillierte Block-/Abwehr- und Folgeaktionen erfassen.',0)];
    add(n<4?'uncertain':'neutral','K3 bewertet den Übergang von Block/Abwehr zum eigenen Gegenangriff.',`K3-Erfolg ${t.winRate||'–'}, Transition-Angriff # ${t.killRate||'–'} bei ${n} Transitionen.`,'Nach Rotation und Auslöser Block/Abwehr vertiefen.',n);
    const weak=[...(result.byRotation||[])].filter(x=>x.n>=4).sort((a,b)=>parseFloat(a.winRate)-parseFloat(b.winRate))[0];
    if(weak)add('warning',`${weak.rotation} ist in K3 auffällig.`,`K3-Erfolg ${weak.winRate} bei ${weak.n} Transitionen.`,'Block-/Abwehrkontakt, Zuspielweg und Gegenangriff dieser Rotation vergleichen.',weak.n);
  }

  if(view==='serve'){
    const total=(result||[]).reduce((a,r)=>a+Number(r.n||0),0),err=(result||[]).reduce((a,r)=>a+Number(r.error||0),0),ace=(result||[]).reduce((a,r)=>a+Number(r.ace||0),0),inPlay=(result||[]).reduce((a,r)=>a+Number(r.inPlay||0),0),br=(result||[]).reduce((a,r)=>a+Number(r.breaks||0),0);
    if(total){
      add(total<4?'uncertain':'neutral','Direktes Aufschlagergebnis und Rallywirkung werden getrennt bewertet.',`Fehler ${fmt(100*err/total)}, Ass ${fmt(100*ace/total)}, im Spiel ${fmt(100*inPlay/total)} = 100 %; Breakquote ${fmt(100*br/total)} separat.`,'Aufschlagart und Zielzone mit Breakquote und Gegnerannahme vergleichen.',total);
    }
  }

  if(view==='reception'){
    const total=(result||[]).reduce((a,r)=>a+Number(r.n||0),0);
    const weighted=(key,countKey='n')=>{let n=0,v=0;for(const r of result||[]){const c=Number(r[countKey]||0),x=parseFloat(String(r[key]||'').replace(',','.'));if(Number.isFinite(x)){n+=c;v+=c*x}}return n?v/n:null};
    add(total<4?'uncertain':'neutral','Annahme wird mit Sideout und erstem Angriff verknüpft.',`Positive Annahme ${fmt(weighted('posRate'))}, Sideout danach ${fmt(weighted('sideoutRate'))}, First Ball ${fmt(weighted('firstBallRate'))}.`,'Nach Rotation und Spielerin die größte Abweichung öffnen.',total);
  }

  if(view==='sets'){
    const total=(result||[]).reduce((a,r)=>a+Number(r.n||0),0),top=[...(result||[])].sort((a,b)=>b.n-a.n)[0];
    if(top)add(total<4?'uncertain':'neutral',`Häufigster Zuspielkontext: ${top.from} → ${top.to}.`,`Rotation ${top.rotation||'–'}, Phase ${top.phase||'–'}, Annahme davor ${top.recQ||'–'}, Folgeangriff # ${top.followKillRate}.`,'Zuspielverteilung bei guter und schwacher Annahme vergleichen.',total);
  }

  if(view==='attacks'){
    const total=(result||[]).reduce((a,r)=>a+Number(r.n||0),0),weak=[...(result||[])].filter(r=>r.n>=4).sort((a,b)=>parseFloat(a.efficiency)-parseFloat(b.efficiency))[0];
    if(weak)add('warning',`Auffälliger Angriffskontext: ${weak.p} ${weak.from} → ${weak.to}.`,`Effizienz ${weak.efficiency}, Rotation ${weak.rotation||'–'}, Phase ${weak.phase||'–'}, Annahme davor ${weak.recQ||'–'}.`,'Vergleichbare Angriffe nach Zuspieltempo und Annahmequalität prüfen.',weak.n);
    else if(total)add(total<4?'uncertain':'neutral','Angriff wird im Kontext von Rotation, Phase, Annahme und Zuspiel bewertet.',`${total} Angriffe in der aktuellen Auswahl.`,'Mit mehr Aktionen werden belastbare Muster sichtbar.',total);
  }

  if(view==='blockdef'){
    const n=(result||[]).reduce((a,r)=>a+Number(r.n||0),0),trans=(result||[]).reduce((a,r)=>a+Number(r.transitionAttack||0),0);
    if(n)add(n<4?'uncertain':'neutral','Block/Abwehr trennt direkten Erfolg von der anschließenden Transition.',`${n} Aktionen, ${trans} davon mit eigenem Transition-Angriff.`,'Direkte Blockpunkte und K3-Erfolg nicht als dieselbe Kennzahl interpretieren.',n);
  }

  if(view==='targets'){
    const n=(result||[]).reduce((a,r)=>a+Number(r.n||0),0),top=[...(result||[])].sort((a,b)=>b.n-a.n)[0];
    if(top)add(n<4?'uncertain':'neutral',`Häufigstes WO→WOHIN-Muster: ${top.technique} ${top.from} → ${top.to}.`,`${top.n} von ${n} Zielaktionen; Erfolg ${top.successRate}.`,'Alternative Zielzonen derselben Ausgangszone vergleichen.',n);
  }

  if(view==='chains'||view==='chainPatterns'){
    const s=report.overall;
    add(s.completeK1<4?'uncertain':'neutral','Aktionsketten bilden wiederkehrende Gewinn-/Verlustmuster ab, keine Kausalitätsbeweise.',`${s.completeK1} vollständige K1-Ketten und ${totalContexts} Rallykontexte stehen zur Verfügung.`,'Häufige Gewinn- und Verlustketten nach Rotation vergleichen.',Math.max(s.completeK1,totalContexts));
  }

  if(view==='k1k2'){
    const s=report.overall;if(s.k1)add(s.k1<4?'uncertain':'neutral','K1 wird über die komplette Erstkontaktkette eingeordnet.',`Positive Annahme ${fmt(s.receptionPositiveRate)} → First Ball ${fmt(s.firstBallRate)} → Angriff-Kill ${fmt(s.attackKillRate)}.`,'Rotationen mit stärkster Abweichung öffnen.',s.k1);
  }

  if(view==='players'||view==='playersOverview'||view==='playerContext'){
    add(totalContexts<4?'uncertain':'neutral','Spielerinnenwirkung wird in Phase und Rotation eingeordnet.','Mannschaftserfolg während einer Beteiligung ist keine individuelle Kausalitätsaussage.','Spielerin nach Technik, K1/K2/K3 und Rotation vergleichen.',totalContexts);
  }

  if(view==='opponent'){
    const rows=result?.contextRows||[],top=[...rows].filter(r=>r.n>=3).sort((a,b)=>b.n-a.n)[0];
    if(top)add('neutral',`Häufigster gegnerischer Kontext: ${top.technique} ${top.from} → ${top.to}.`,`Rotation ${top.rotation||'–'}, ${top.n} Aktionen, gegnerischer Rallyerfolg ${top.oppWinRate}.`,'Tendenz nach Rotation und Spielsituation prüfen.',top.n);
    else add(totalContexts<4?'uncertain':'neutral','Gegnertrends beruhen ausschließlich auf erfassten Gegneraktionen.','Bei kleinen Datenmengen werden keine starken Aussagen erzeugt.','Mehr Gegneraktionen erfassen.',totalContexts);
  }

  if(view==='techniques'){
    add(totalContexts<4?'uncertain':'neutral','Technikqualität wird mit Rallyphase und Folgewirkung verknüpft.',`${totalContexts} Rallykontexte stehen zur Einordnung bereit.`,'Qualitätsstufen nach K1/K2/K3 und Rotation vergleichen.',totalContexts);
  }

  if(view==='rallies'||view==='overview'){
    const s=report.overall;add(s.rallies<4?'uncertain':'neutral','Die Gesamtanalyse verbindet Rallyergebnis mit den innerhalb der Rally erfassten Aktionsketten.',`${s.rallies} Rallykontexte; ${s.completeK1} vollständige K1-Ketten.`,'Auffällige Rotation oder Technik öffnen.',s.rallies);
  }
  return out;
}
