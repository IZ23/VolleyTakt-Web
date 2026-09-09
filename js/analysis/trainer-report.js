// VolleyTakt Live · ANALYSIS-REPORT3
// Interpreted coach report: prioritises context and next actions instead of reproducing the dashboard.
const num=v=>{const n=Number.parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weighted=(rows,key,count='n')=>{let n=0,sum=0;for(const r of rows||[]){const c=Number(r?.[count]||0),v=num(r?.[key]);if(c&&v!=null){n+=c;sum+=c*v}}return n?sum/n:null};
const fmt=v=>num(v)==null?'–':`${num(v).toFixed(1).replace('.',',')} %`;
const displayPct=v=>{const n=num(v);return n==null?'–':`${n.toFixed(1).replace('.',',')} %`};
const formatDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return value||'–';const [y,m,d]=value.split('-');return `${d}.${m}.${y}`};
const sampleText=n=>n<4?'zu wenig':n<8?'klein':n<18?'mittel':'gut';
const insight=(title,finding,interpretation,next,sample)=>({title,finding,interpretation,next,sample,confidence:sampleText(Number(sample||0))});

export function buildTrainerReport({matches=[],dash={},filters={},matchNames=()=>'',matchScoreText=()=>'',matchTypes=()=>[]}={}){
  const single=matches.length===1?matches[0]:null;
  const raw=single?clean(matchNames(single)):'';
  const own=single?clean(single.ownTeamName||single.fullState?.quickOwnName||raw.split(' – ')[0]||'Eigenes Team'):'';
  const opp=single?clean(single.oppTeamName||single.fullState?.quickOppName||raw.split(' – ').slice(1).join(' – ')||'Gegner'):'';
  const title=single?`${own} – ${opp}`:`Traineranalyse · ${matches.length} Spiele`;
  const date=single?formatDate(String(single.matchDate||'').slice(0,10)):[filters?.From,filters?.To].filter(Boolean).join(' bis ')||'–';
  const score=single?clean(matchScoreText(single)):'';
  const matchType=single?clean(single.matchTypeName||single.fullState?.matchTypeName||''):'';
  const matchFinished=!!(single?.matchComplete||single?.fullState?.matchComplete);
  const meta=single?[
    {label:'Datum',value:date},{label:'Gegner',value:opp||'–'},{label:matchFinished?'Ergebnis':'Spielstand',value:score||'–'},...(matchType?[{label:'Spielart',value:matchType}]:[])
  ]:[{label:'Zeitraum',value:date},{label:'Spiele',value:String(matches.length)}];

  const overview=dash.overview||{},k=dash.k1k2||{},fb=dash.firstball?.total||{},k3=dash.k3?.total||{};
  const rotations=(dash.rotations||[]).filter(r=>Number(r.rallies||0)>0);
  const meaningful=rotations.filter(r=>Number(r.rallies||0)>=4);
  const worst=meaningful.slice().sort((a,b)=>Number(a.points||0)-Number(b.points||0))[0];
  const best=meaningful.slice().sort((a,b)=>Number(b.points||0)-Number(a.points||0))[0];
  const rec=weighted(dash.reception,'posRate'),att=weighted(dash.attacks,'efficiency');
  const serveRows=dash.serve||[],serveN=serveRows.reduce((a,r)=>a+Number(r.n||0),0);
  const serveBreak=serveN?100*serveRows.reduce((a,r)=>a+Number(r.breaks||0),0)/serveN:null;
  const serveErr=serveN?100*serveRows.reduce((a,r)=>a+Number(r.error||0),0)/serveN:null;
  const serveAce=serveN?100*serveRows.reduce((a,r)=>a+Number(r.ace||0),0)/serveN:null;

  const priorities=[];
  if(num(k.k1Sideout)!=null&&num(k.k1Sideout)<40)
    priorities.push(insight('K1 / Sideout priorisieren',`Sideout ${displayPct(k.k1Sideout)}; First Ball ${displayPct(k.firstBall)}.`,'Die Mannschaft löst gegnerischen Aufschlag aktuell deutlich seltener direkt oder früh. Annahme, Zuspiel und erster Angriff sollten als gemeinsame Kette betrachtet werden.','Nach Rotation und Annahmequalität differenzieren; anschließend Zuspielverteilung und ersten Angriff prüfen.',k.k1Count));
  if(worst&&Number(worst.points||0)<0)
    priorities.push(insight(`${worst.rotation} ist die kritischste Rotation`,`Rallybilanz ${Number(worst.points)>=0?'+':''}${worst.points} bei ${worst.rallies} Rallys; K1 ${displayPct(worst.k1Sideout)}.`,'Die negative Bilanz beschreibt eine Mannschaftssituation in dieser Rotation. Sie beweist keine Ursache durch die Zuspielerin oder einzelne Spielerinnen.','Annahmequalität, First Ball, Zuspielwege und Angriffsabschluss genau in dieser Rotation vergleichen.',worst.rallies));
  if(att!=null&&att<0)
    priorities.push(insight('Angriffseffizienz unter Druck',`Gesamte Angriffseffizienz ${fmt(att)}.`,'Negative Effizienz bedeutet, dass direkte Fehler und gegnerische Punktwirkungen die erfolgreichen Abschlüsse überwiegen können.','Nach Phase, Rotation, Annahmequalität sowie WO→WOHIN gruppieren.',(dash.attacks||[]).reduce((a,r)=>a+Number(r.n||0),0)));
  if(serveBreak!=null&&serveBreak>=55)
    priorities.push(insight('Eigenen Aufschlag als Stärke sichern',`Breakwirkung ${fmt(serveBreak)}, Fehler ${fmt(serveErr)}, Asse ${fmt(serveAce)}.`,'Der eigene Aufschlag erzeugt eine gute Rallywirkung. Assquote und Fehlerquote bleiben dabei separate direkte Ergebnisse.','Zielzonen und Aufschlagtechniken mit hoher Breakwirkung identifizieren und Fehlerquote mitbeobachten.',serveN));
  if(k3.n>=4)
    priorities.push(insight('K3 / Transition beobachten',`Erkannte Transitionen ${k3.n}; Erfolgsquote ${displayPct(k3.winRate)}.`,'Der Wert beschreibt den Übergang nach Block/Abwehr in den Gegenangriff und sollte nicht mit K1/K2 vermischt werden.','Trigger Block vs. Abwehr, Zuspielziel und Abschluss im Gegenangriff vergleichen.',k3.n));
  if(!priorities.length)
    priorities.push(insight('Datenbasis weiter verdichten','Keine einzelne Kennzahl dominiert die gefilterte Analyse.','Die vorliegenden Werte zeigen eher mehrere kleinere Ansatzpunkte als eine klare Hauptursache.','Weitere Rallys erfassen und die Rotationen getrennt vergleichen.',overview.rallies||0));

  const phases=[
    {key:'K1',title:'K1 · nach gegnerischem Aufschlag',metrics:[['Sideout',displayPct(k.k1Sideout)],['First Ball',displayPct(k.firstBall)],['Annahme +/#',rec==null?'–':fmt(rec)]],
      text:num(k.k1Sideout)!=null&&num(k.firstBall)!=null&&num(k.firstBall)<num(k.k1Sideout)-10?'Der Abstand zwischen Sideout und First Ball zeigt: Rallys werden teilweise später noch gewonnen, aber selten unmittelbar im ersten Angriff entschieden.':'Sideout und First Ball gemeinsam mit Annahme und erstem Angriff betrachten.'},
    {key:'K2',title:'K2 · eigener Aufschlag',metrics:[['Break',displayPct(k.k2Break)],['Aufschläge',String(serveN)],['Fehler',serveErr==null?'–':fmt(serveErr)],['Asse',serveAce==null?'–':fmt(serveAce)]],
      text:serveBreak!=null&&serveBreak>=55?'Der eigene Aufschlag erzeugt insgesamt eine positive Rallywirkung. Ziel ist, diesen Druck mit kontrolliertem Fehlerrisiko zu erhalten.':'Aufschlagwirkung über Breakquote, direkte Ergebnisse und Zielzonen gemeinsam bewerten.'},
    {key:'K3',title:'K3 · Transition',metrics:[['Transitionen',String(k3.n||0)],['Gewonnen',displayPct(k3.winRate)],['Kill im Gegenangriff',displayPct(k3.killRate)]],
      text:Number(k3.n||0)<4?'Für K3 liegen noch zu wenige erkannte Transitionen für eine belastbare Aussage vor.':'K3 zeigt, wie gut Block/Abwehr in einen strukturierten Gegenangriff überführt werden.'}
  ];

  const rotationRows=rotations.map(r=>({
    rotation:r.rotation,rallies:Number(r.rallies||0),balance:Number(r.points||0),
    k1:displayPct(r.k1Sideout),firstBall:displayPct(r.firstBall),k2:displayPct(r.k2Break),k3:displayPct(r.k3WinRate),
    rec:displayPct(r.receptionPositive),attack:displayPct(r.attackKill)
  }));

  const techniques=[
    {title:'Annahme',value:rec==null?'–':fmt(rec),label:'positiv/perfekt',text:worst&&worst.receptionPositive?`${worst.rotation}: ${displayPct(worst.receptionPositive)}. Rotationseffekt weiter prüfen.`:'Mit K1 und First Ball verknüpfen.'},
    {title:'Angriff',value:att==null?'–':fmt(att),label:'Effizienz',text:'Nach Phase, Rotation, Annahmequalität und Zuspielkontext differenzieren.'},
    {title:'Aufschlag',value:serveBreak==null?'–':fmt(serveBreak),label:'Breakwirkung',text:`Direkt: ${fmt(serveAce)} Ass · ${fmt(serveErr)} Fehler.`},
    {title:'Block / Abwehr',value:String((dash.blockdef||[]).reduce((a,r)=>a+Number(r.n||0),0)),label:'erfasste Aktionen',text:'Übergang in K3/Transition als Folgewirkung betrachten.'}
  ];

  const playerRows=(dash.playerContext||[]).slice(0,10).map(r=>({
    player:r.player?.abbreviation||r.p||'–',actions:Number(r.actions||r.n||0),
    k1:Number(r.phases?.K1?.n||0),k2:Number(r.phases?.K2?.n||0),k3:Number(r.phases?.K3?.n||0)
  }));
  const opponent=dash.opponent||{};
  const oppAttackN=(opponent.attacks||[]).reduce((a,r)=>a+Number(r.n||0),0);
  const oppServeN=(opponent.serves||[]).reduce((a,r)=>a+Number(r.n||0),0);
  const oppSetN=(opponent.sets||[]).reduce((a,r)=>a+Number(r.n||0),0);
  const oppCaptured=(opponent.contextRows||[]).length>0||oppAttackN+oppServeN+oppSetN>0;
  const opponentSummary=[
    {label:'Gegnerangriffe',value:oppCaptured?String(oppAttackN):'nicht erfasst'},
    {label:'Gegneraufschläge',value:oppCaptured?String(oppServeN):'nicht erfasst'},
    {label:'Gegner-Zuspiele',value:oppCaptured?String(oppSetN):'nicht erfasst'}
  ];

  const training=[];
  if(priorities.some(p=>/K1|Rotation/.test(p.title)))training.push('K1 in der kritischsten Rotation unter realem Aufschlagdruck trainieren: Annahme → Zuspielentscheidung → erster Angriff.');
  if(priorities.some(p=>/Angriff/.test(p.title)))training.push('Angriff aus schwierigen Situationen mit klaren Sicherheits- und Punktlösungen differenzieren.');
  if(priorities.some(p=>/Aufschlag/.test(p.title)))training.push('Aufschlagzielzonen mit Breakwirkung koppeln und Fehlerquote als Gegenkennzahl mitführen.');
  if(priorities.some(p=>/K3/.test(p.title)))training.push('Transition nach Block/Abwehr: schneller Ordnungswechsel, klare Zuspieloption, definierter Gegenangriff.');
  if(!training.length)training.push('Stabile Muster bestätigen und die schwächste Rotation gezielt mit höherem Druck testen.');

  return {schema:2,title,meta,generatedAt:new Date().toISOString(),overview:{rallyRate:displayPct(overview.rallyRate),rallies:overview.rallies||0,best:best?.rotation||'–',worst:worst?.rotation||'–'},
    priorities:priorities.slice(0,5),phases,rotations:rotationRows,techniques,players:playerRows,opponent:opponentSummary,training:training.slice(0,4),
    note:'Interpretationen sind datenabhängige Trainerhinweise. Sie zeigen Zusammenhänge und Hypothesen, aber keine bewiesenen Ursachen.'};
}

export function trainerReportHtml(report={}){
  const metric=(label,value)=>`<span><small>${esc(label)}</small><strong>${esc(value)}</strong></span>`;
  return `<article class="trainer-report trainer-report-detail">
    <header class="trainer-report-head"><div><span class="trainer-report-brand">VolleyTakt · Trainerbericht</span><h1>${esc(report.title)}</h1><div class="trainer-report-meta">${(report.meta||[]).map(m=>metric(m.label,m.value)).join('')}</div></div><span class="trainer-report-badge">für Trainer</span></header>
    <section class="trainer-report-summary"><h2>Spielbild</h2><div>${metric('Rallyquote',report.overview?.rallyRate)}${metric('Rallys',report.overview?.rallies)}${metric('stabilste Rotation',report.overview?.best)}${metric('kritischste Rotation',report.overview?.worst)}</div></section>
    <section class="trainer-report-priorities"><h2>1 · Wichtigste Erkenntnisse</h2>${(report.priorities||[]).map((p,i)=>`<article><span class="trainer-priority-no">${i+1}</span><div><h3>${esc(p.title)}</h3><strong>${esc(p.finding)}</strong><p>${esc(p.interpretation)}</p><p class="trainer-next"><b>Weiter analysieren:</b> ${esc(p.next)}</p><small>Datenbasis: ${esc(p.confidence)}${p.sample?` · n=${esc(p.sample)}`:''}</small></div></article>`).join('')}</section>
    <section class="trainer-report-phases"><h2>2 · Spielphasen</h2><div>${(report.phases||[]).map(p=>`<article><h3>${esc(p.title)}</h3><div class="trainer-phase-metrics">${p.metrics.map(m=>metric(m[0],m[1])).join('')}</div><p>${esc(p.text)}</p></article>`).join('')}</div></section>
    <section class="trainer-report-rotations"><h2>3 · Rotationen</h2><div class="trainer-report-table-wrap"><table><thead><tr><th>Rotation</th><th>Rallys</th><th>Bilanz</th><th>K1</th><th>First Ball</th><th>K2</th><th>K3</th><th>Annahme +/#</th></tr></thead><tbody>${(report.rotations||[]).map(r=>`<tr><td><b>${esc(r.rotation)}</b></td><td>${r.rallies}</td><td class="${r.balance<0?'neg':r.balance>0?'pos':''}">${r.balance>=0?'+':''}${r.balance}</td><td>${esc(r.k1)}</td><td>${esc(r.firstBall)}</td><td>${esc(r.k2)}</td><td>${esc(r.k3)}</td><td>${esc(r.rec)}</td></tr>`).join('')}</tbody></table></div><p class="trainer-report-help">Rallybilanz = gewonnene minus verlorene Rallys. Negative Werte priorisieren die weitere Analyse, beweisen aber keine Ursache.</p></section>
    <section class="trainer-report-techniques"><h2>4 · Technik- und Aktionsanalyse</h2><div>${(report.techniques||[]).map(x=>`<article><strong>${esc(x.value)}</strong><h3>${esc(x.title)}</h3><span>${esc(x.label)}</span><p>${esc(x.text)}</p></article>`).join('')}</div></section>
    <section class="trainer-report-context-grid"><div><h2>5 · Spielerinnen im Kontext</h2><div class="trainer-report-table-wrap"><table><thead><tr><th>Spielerin</th><th>Aktionen</th><th>K1</th><th>K2</th><th>K3</th></tr></thead><tbody>${(report.players||[]).map(r=>`<tr><td>${esc(r.player)}</td><td>${r.actions}</td><td>${r.k1}</td><td>${r.k2}</td><td>${r.k3}</td></tr>`).join('')}</tbody></table></div><p class="trainer-report-help">Aktionsvolumen und Phasenbeteiligung sind keine Rangliste und keine individuelle Kausalitätsaussage.</p></div><div><h2>6 · Gegnerdaten</h2><div class="trainer-opponent-metrics">${(report.opponent||[]).map(m=>metric(m.label,m.value)).join('')}</div><p class="trainer-report-help">Für belastbare Gegnertrends Zielzonen, Rotationen und Aktionsketten in der Analyse vertiefen.</p></div></section>
    <section class="trainer-report-training"><h2>7 · Trainingsableitung</h2><ol>${(report.training||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>Im nächsten Spiel beobachten</h3><ul><li>Verändert sich die kritischste Rotation?</li><li>Steigt der First-Ball-Anteil im K1?</li><li>Bleibt die K2-/Aufschlagwirkung stabil?</li></ul></section>
    <footer>${esc(report.note)}</footer>
  </article>`;
}


export function trainerShortReportHtml(report={}){
  const metric=(label,value)=>`<span><small>${esc(label)}</small><strong>${esc(value)}</strong></span>`;
  const priorities=(report.priorities||[]).slice(0,4);
  const phaseByKey=key=>(report.phases||[]).find(x=>x.key===key)||{title:key,metrics:[],text:''};
  const k1=phaseByKey('K1'),k2=phaseByKey('K2'),k3=phaseByKey('K3');
  const worst=(report.rotations||[]).slice().sort((a,b)=>Number(a.balance||0)-Number(b.balance||0))[0];
  const best=(report.rotations||[]).slice().sort((a,b)=>Number(b.balance||0)-Number(a.balance||0))[0];
  return `<article class="trainer-report trainer-report-short">
    <header class="trainer-report-head"><div><span class="trainer-report-brand">VolleyTakt · Trainer-Kurzreport</span><h1>${esc(report.title)}</h1><div class="trainer-report-meta">${(report.meta||[]).map(m=>metric(m.label,m.value)).join('')}</div></div><span class="trainer-report-badge">Kurzreport</span></header>
    <section class="trainer-short-overview"><h2>Spielbild</h2><div class="trainer-short-overview-grid">${metric('Rallyquote',report.overview?.rallyRate)}${metric('Rallys',report.overview?.rallies)}${metric('stabilste Rotation',report.overview?.best)}${metric('kritischste Rotation',report.overview?.worst)}</div></section>
    <section class="trainer-short-priorities"><h2>Wichtigste Erkenntnisse</h2>${priorities.map((p,i)=>`<article><b>${i+1}</b><div><h3>${esc(p.title)}</h3><strong>${esc(p.finding)}</strong><p>${esc(p.interpretation)}</p></div></article>`).join('')}</section>
    <section class="trainer-short-phases"><h2>K1 / K2 / K3</h2><div>${[k1,k2,k3].map(p=>`<article><h3>${esc(p.title)}</h3><div>${(p.metrics||[]).map(m=>metric(m[0],m[1])).join('')}</div><p>${esc(p.text)}</p></article>`).join('')}</div></section>
    <section class="trainer-short-rotation"><h2>Rotationen</h2><div class="trainer-report-table-wrap"><table><thead><tr><th>R</th><th>Rallys</th><th>Bilanz</th><th>K1</th><th>First Ball</th><th>K2</th><th>K3</th></tr></thead><tbody>${(report.rotations||[]).map(r=>`<tr><td><b>${esc(r.rotation)}</b></td><td>${r.rallies}</td><td class="${r.balance<0?'neg':r.balance>0?'pos':''}">${r.balance>=0?'+':''}${r.balance}</td><td>${esc(r.k1)}</td><td>${esc(r.firstBall)}</td><td>${esc(r.k2)}</td><td>${esc(r.k3)}</td></tr>`).join('')}</tbody></table></div><p class="trainer-report-help">${worst?`Kritisch: ${esc(worst.rotation)} (${worst.balance>=0?'+':''}${worst.balance}).`:''} ${best?`Stabil: ${esc(best.rotation)} (${best.balance>=0?'+':''}${best.balance}).`:''}</p></section>
    <section class="trainer-short-technique"><h2>Technik-Kernwerte</h2><div>${(report.techniques||[]).map(x=>`<article><strong>${esc(x.value)}</strong><span>${esc(x.title)}</span><small>${esc(x.label)}</small></article>`).join('')}</div></section>
    <section class="trainer-short-training"><h2>Trainingsprioritäten</h2><ol>${(report.training||[]).slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>Im nächsten Spiel beobachten</h3><p>kritischste Rotation · First Ball im K1 · Stabilität der K2-/Aufschlagwirkung</p></section>
    <footer>${esc(report.note)}</footer>
  </article>`;
}


export function trainerReportText(report={},variant='detail'){
  const short=variant==='short';
  const lines=[`🏐 VolleyTakt ${short?'Trainer-Kurzreport':'Trainer-Detailreport'}`,`*${clean(report.title)}*`];
  for(const m of report.meta||[])lines.push(`${m.label}: ${clean(m.value)}`);
  lines.push('','📌 Spielbild',`Rallyquote: ${clean(report.overview?.rallyRate)} · stabil: ${clean(report.overview?.best)} · kritisch: ${clean(report.overview?.worst)}`);
  lines.push('','🎯 Wichtigste Erkenntnisse');
  for(const p of report.priorities||[]){
    lines.push(`• ${clean(p.title)} — ${clean(p.finding)}`);
    lines.push(`  ${clean(p.interpretation)}`);
    if(!short)lines.push(`  Weiter analysieren: ${clean(p.next)}`);
  }
  lines.push('','📊 K1 / K2 / K3');
  for(const phase of report.phases||[]){
    const metrics=(phase.metrics||[]).map(m=>`${m[0]} ${m[1]}`).join(' · ');
    lines.push(`• ${clean(phase.title)}: ${metrics}`);
    lines.push(`  ${clean(phase.text)}`);
  }
  lines.push('','🔄 Rotationen');
  for(const r of report.rotations||[])lines.push(`• ${r.rotation}: Bilanz ${r.balance>=0?'+':''}${r.balance} · K1 ${r.k1} · First Ball ${r.firstBall} · K2 ${r.k2} · K3 ${r.k3}`);
  lines.push('','🏐 Trainingsprioritäten');
  for(const x of report.training||[])lines.push(`• ${clean(x)}`);
  if(!short){
    lines.push('','👥 Spielerinnen im Kontext');
    for(const r of report.players||[])lines.push(`• ${clean(r.player)}: ${r.actions} Aktionen · K1 ${r.k1} · K2 ${r.k2} · K3 ${r.k3}`);
    lines.push('','🔎 Gegnerdaten');
    for(const m of report.opponent||[])lines.push(`• ${clean(m.label)}: ${clean(m.value)}`);
  }
  lines.push('',clean(report.note));
  return lines.join('\n').trim();
}

export async function copyTrainerReportText(report={},variant='detail'){
  const text=trainerReportText(report,variant);
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return text}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';
  document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return text;
}

function trainerCanvasLines(ctx,text,maxWidth){
  const words=clean(text).split(' '),lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word}else line=next}
  if(line)lines.push(line);return lines;
}
function trainerCanvasWrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=5){
  const lines=trainerCanvasLines(ctx,text,maxWidth).slice(0,maxLines);
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
  return y+lines.length*lineHeight;
}
export async function trainerReportPngBlob(report={},variant='detail'){
  const short=variant==='short',canvas=document.createElement('canvas');
  canvas.width=1080;canvas.height=short?1350:1920;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Bildexport wird von diesem Browser nicht unterstützt.');
  ctx.fillStyle='#07111f';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#0e7490';ctx.fillRect(0,0,canvas.width,180);
  ctx.fillStyle='#dff6ff';ctx.font='700 24px system-ui,sans-serif';ctx.fillText(`VOLLEYTAKT · TRAINER-${short?'KURZ':'DETAIL'}REPORT`,55,48);
  ctx.fillStyle='#fff';ctx.font='800 40px system-ui,sans-serif';ctx.fillText(clean(report.title),55,100);
  ctx.fillStyle='#dbeafe';ctx.font='20px system-ui,sans-serif';
  ctx.fillText((report.meta||[]).map(m=>`${m.label}: ${clean(m.value)}`).join(' · '),55,143);

  let y=225;
  const section=(title,items,max=4)=>{
    ctx.fillStyle='#13243a';ctx.beginPath();ctx.roundRect(45,y,990,Math.max(150,70+items.length*105),18);ctx.fill();
    ctx.fillStyle='#f8fafc';ctx.font='800 27px system-ui,sans-serif';ctx.fillText(title,70,y+42);
    let cy=y+78;
    for(const item of items.slice(0,max)){
      ctx.fillStyle='#e2e8f0';ctx.font='700 20px system-ui,sans-serif';cy=trainerCanvasWrap(ctx,item.title||'',70,cy,900,25,2)+5;
      ctx.fillStyle='#9fb3c8';ctx.font='18px system-ui,sans-serif';cy=trainerCanvasWrap(ctx,item.text||'',82,cy,885,23,3)+12;
    }
    y=cy+20;
  };
  section('Wichtigste Erkenntnisse',(report.priorities||[]).map(p=>({title:p.title,text:`${p.finding} ${p.interpretation}`})),short?4:5);
  section('Spielphasen',(report.phases||[]).map(p=>({title:p.title,text:`${(p.metrics||[]).map(m=>`${m[0]} ${m[1]}`).join(' · ')}. ${p.text}`})),3);
  section('Trainingsprioritäten',(report.training||[]).map((x,i)=>({title:`${i+1}.`,text:x})),3);
  if(!short&&y<canvas.height-320)section('Spielerinnen im Kontext',(report.players||[]).slice(0,6).map(r=>({title:r.player,text:`${r.actions} Aktionen · K1 ${r.k1} · K2 ${r.k2} · K3 ${r.k3}`})),6);
  ctx.fillStyle='#7890a8';ctx.font='16px system-ui,sans-serif';trainerCanvasWrap(ctx,report.note||'',55,canvas.height-70,960,20,2);
  return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG konnte nicht erzeugt werden.')),'image/png',0.95));
}
export async function downloadTrainerReportPng(report={},variant='detail',base='VolleyTakt_Trainer'){
  const blob=await trainerReportPngBlob(report,variant),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${base}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);return true;
}
export async function shareTrainerReport(report={},variant='detail',base='VolleyTakt_Trainer'){
  const text=trainerReportText(report,variant),title=`VolleyTakt · ${clean(report.title||'Trainerreport')}`;
  if(navigator.share){
    try{
      const blob=await trainerReportPngBlob(report,variant),file=new File([blob],`${base}.png`,{type:'image/png'});
      if(navigator.canShare?.({files:[file]})){await navigator.share({title,text,files:[file]});return 'file'}
    }catch(error){if(error?.name==='AbortError')return 'cancelled'}
    await navigator.share({title,text});return 'text';
  }
  await copyTrainerReportText(report,variant);return 'copied';
}
