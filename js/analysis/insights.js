// VolleyTakt Live · ANALYSIS-INSIGHT1
// Local, deterministic, data-dependent insight engine.
// It emits structured findings and only then renders text; no LLM/network required.

const pct=v=>{const n=Number.parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
const avg=vals=>{const a=vals.filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
const confidence=n=>n>=18?'high':n>=8?'medium':n>=4?'low':'insufficient';
const confidenceLabel=c=>({high:'gute Datenbasis',medium:'mittlere Datenbasis',low:'kleine Datenbasis',insufficient:'zu wenig Daten'})[c]||c;
const deltaLabel=d=>Math.abs(d)<4?'nahe am Vergleichswert':d>=0?'über dem Vergleichswert':'unter dem Vergleichswert';

export function rotationInsights(rows=[]){
  const active=rows.filter(r=>Number(r.rallies)>0);
  const baseline=active.filter(r=>Number(r.rallies)>=4);
  const k1avg=avg((baseline.length?baseline:active).map(r=>pct(r.k1Sideout)));
  const k2avg=avg((baseline.length?baseline:active).map(r=>pct(r.k2Break)));
  return active.map(r=>{
    const n=Number(r.rallies||0), c=confidence(n), k1=pct(r.k1Sideout), k2=pct(r.k2Break);
    const d1=k1!=null&&k1avg!=null?k1-k1avg:null, d2=k2!=null&&k2avg!=null?k2-k2avg:null;
    let kind='neutral', finding=`${r.rotation} liegt insgesamt im Bereich der übrigen Rotationen.`, context='K1 und K2 sollten gemeinsam betrachtet werden.', next='Bei Bedarf einzelne Rallys und Technikketten öffnen.';
    if(c==='insufficient'){
      kind='uncertain'; finding=`${r.rotation} basiert aktuell nur auf ${n} Rally${n===1?'':'s'}.`; context='Die Datenmenge ist für eine belastbare Rotationsbewertung noch zu klein.'; next='Weitere Rallys erfassen und die Rotation anschließend erneut vergleichen.';
    }else if(d1!=null&&d1<=-10 && (d2==null||d2>-10)){
      kind='warning'; finding=`${r.rotation} fällt vor allem im Sideout auf (${r.k1Sideout}).`; context=`K1 liegt ${Math.abs(d1).toFixed(1).replace('.',',')} Prozentpunkte unter dem Rotationsmittel, während K2 ${deltaLabel(d2??0)} liegt.`; next='Annahme → Zuspiel → ersten Angriff dieser Rotation vertiefen.';
    }else if(d2!=null&&d2<=-10 && (d1==null||d1>-10)){
      kind='warning'; finding=`${r.rotation} fällt vor allem in der Breakphase auf (${r.k2Break}).`; context=`K2 liegt ${Math.abs(d2).toFixed(1).replace('.',',')} Prozentpunkte unter dem Rotationsmittel.`; next='Aufschlagwirkung und anschließende Block-/Abwehrkette dieser Rotation prüfen.';
    }else if(d1!=null&&d1>=10 && d2!=null&&d2>=8){
      kind='positive'; finding=`${r.rotation} ist in K1 und K2 überdurchschnittlich.`; context=`Sideout und Break liegen beide über dem Rotationsmittel.`; next='Prüfen, welche Aufstellung bzw. Aktionsketten diesen Vorteil erzeugen.';
    }
    return {scope:'rotation',key:r.rotation,kind,confidence:c,sample:n,finding,context,next};
  });
}

export function k1k2Insights(result={}){
  const n1=Number(result.k1Count||0), n2=Number(result.k2Count||0), k1=pct(result.k1Sideout), k2=pct(result.k2Break), fb=pct(result.firstBall);
  const c=confidence(Math.max(n1,n2));
  const out=[];
  if(n1<4) out.push({kind:'uncertain',confidence:'insufficient',sample:n1,finding:`K1 basiert nur auf ${n1} Rallys.`,context:'Die Sideout-Werte sind noch nicht belastbar.',next:'Weitere K1-Rallys erfassen.'});
  else if(fb!=null&&k1!=null&&fb<k1-12) out.push({kind:'warning',confidence:c,sample:n1,finding:`First-Ball-Sideout (${result.firstBall}) liegt deutlich unter der gesamten Sideout-Quote (${result.k1Sideout}).`,context:'Ein Teil der Sideouts wird erst nach längeren Rallyphasen gewonnen.',next:'Annahmequalität, Zuspielauswahl und ersten Angriff gemeinsam prüfen.'});
  else out.push({kind:'neutral',confidence:c,sample:n1,finding:`K1-Sideout liegt bei ${result.k1Sideout}.`,context:`First Ball: ${result.firstBall}; K2-Break: ${result.k2Break}.`,next:'Rotationen mit der größten Abweichung öffnen.'});
  return out;
}

export function receptionInsights(rows=[]){
  const total=rows.reduce((s,r)=>s+Number(r.n||0),0), pos=rows.reduce((s,r)=>s+Number(r.pos||0),0);
  const p=total?100*pos/total:null, c=confidence(total);
  if(c==='insufficient') return [{kind:'uncertain',confidence:c,sample:total,finding:`Nur ${total} Annahmen in der aktuellen Auswahl.`,context:'Eine belastbare Interpretation ist noch nicht möglich.',next:'Datenbasis erweitern.'}];
  const spread=rows.map(r=>({label:r.p,n:Number(r.n||0),rate:pct(r.posRate)})).filter(x=>x.n>=4&&x.rate!=null).sort((a,b)=>a.rate-b.rate);
  if(spread.length>=2&&spread.at(-1).rate-spread[0].rate>=18) return [{kind:'warning',confidence:c,sample:total,finding:`Die Annahmeleistung unterscheidet sich deutlich zwischen Spielerinnen.`,context:`Spannweite der positiven Annahme: ${(spread.at(-1).rate-spread[0].rate).toFixed(1).replace('.',',')} Prozentpunkte.`,next:'Sideout nach Annahmespielerin und Rotation vergleichen.'}];
  return [{kind:'neutral',confidence:c,sample:total,finding:`Positive Annahme gesamt: ${p==null?'–':p.toFixed(1).replace('.',',')+' %'}.`,context:'Keine starke interne Abweichung mit ausreichender Stichprobe erkannt.',next:'Zusammenhang mit First-Ball-Sideout prüfen.'}];
}

export function attackInsights(rows=[]){
  const total=rows.reduce((s,r)=>s+Number(r.n||0),0), kills=rows.reduce((s,r)=>s+Number(r.kill||0),0), errs=rows.reduce((s,r)=>s+Number(r.err||0),0), blocks=rows.reduce((s,r)=>s+Number(r.blocked||0),0);
  const eff=total?100*(kills-errs-blocks)/total:null, c=confidence(total);
  if(c==='insufficient') return [{kind:'uncertain',confidence:c,sample:total,finding:`Nur ${total} Angriffe in der aktuellen Auswahl.`,context:'Die Angriffseffizienz ist noch wenig belastbar.',next:'Mehr Angriffe erfassen.'}];
  const finding=`Angriffseffizienz gesamt: ${eff==null?'–':eff.toFixed(1).replace('.',',')+' %'} bei ${total} Angriffen.`;
  let context='Kills, Fehler und geblockte Angriffe werden gemeinsam berücksichtigt.', next='Quelle, Ziel und Spielerin mit der stärksten Abweichung öffnen.';
  if(total&&((errs+blocks)/total)>=.30){context='Ein hoher Anteil der Angriffe endet als Fehler oder direkter Block.';next='Angriffsquelle, Zuspielweg und Zielzonen der negativen Aktionen prüfen.'}
  return [{kind:(total&&((errs+blocks)/total)>=.30)?'warning':'neutral',confidence:c,sample:total,finding,context,next}];
}

export function serveInsights(rows=[]){
  const total=rows.reduce((s,r)=>s+Number(r.n||0),0), errs=rows.reduce((s,r)=>s+Number(r.err||0),0), aces=rows.reduce((s,r)=>s+Number(r.ace||0),0), breaks=rows.reduce((s,r)=>s+Number(r.breaks||0),0);
  const c=confidence(total);
  if(c==='insufficient') return [{kind:'uncertain',confidence:c,sample:total,finding:`Nur ${total} Aufschläge in der Auswahl.`,context:'Für Tendenzen fehlen noch Daten.',next:'Weitere Aufschläge erfassen.'}];
  return [{kind:errs>aces*2&&errs/total>.15?'warning':'neutral',confidence:c,sample:total,finding:`Breakquote im eigenen Aufschlag: ${(100*breaks/total).toFixed(1).replace('.',',')} %.`,context:`${aces} Ass${aces===1?'':'e'} und ${errs} Aufschlagfehler bei ${total} Aufschlägen.`,next:errs>aces*2?'Fehlerquote gegen Breakwirkung je Aufschlagart vergleichen.':'Aufschlagart und Zielzone der besten Breakserien prüfen.'}];
}

export function insightsFor(view,result={}){
  if(view==='rotations') return rotationInsights(result);
  if(view==='k1k2') return k1k2Insights(result);
  if(view==='reception') return receptionInsights(result);
  if(view==='attacks') return attackInsights(result);
  if(view==='serve') return serveInsights(result);
  if(view==='priorityA') return [...k1k2Insights(result?.phases||{}),...rotationInsights(result?.rotations||[]).slice(0,2)];
  return [];
}
export function confidenceText(c,sample){return `${confidenceLabel(c)} · n=${sample}`;}
