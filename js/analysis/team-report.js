import {reportExportBase} from './report-export.js';
// VolleyTakt Live · ANALYSIS-REPORT2 / ANALYSIS-SHARE1
// Player-friendly team report. Keeps coaching language concrete and avoids causal claims.
const num=v=>{const n=Number.parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null};
const pct=v=>{const n=num(v);return n==null?'–':`${n.toFixed(1).replace('.',',')} %`};
const displayPct=v=>pct(v);
const clampText=(s,max=120)=>{const t=String(s||'').trim();return t.length<=max?t:t.slice(0,max-1).trimEnd()+'…'};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();

function weighted(rows,key,count='n'){
  let n=0,sum=0;
  for(const r of rows||[]){const c=Number(r?.[count]||0),v=num(r?.[key]);if(c&&v!=null){n+=c;sum+=c*v}}
  return n?sum/n:null;
}
function rotationCandidates(rows=[]){
  return rows.filter(r=>Number(r.rallies||0)>=4).map(r=>({
    ...r,
    balanceRate:Number(r.rallies)?100*Number(r.points||0)/Number(r.rallies):0
  }));
}
function addUnique(arr,item){
  if(!item?.text)return;
  if(!arr.some(x=>x.text===item.text))arr.push(item);
}
function phraseMetric(label,value,note=''){return {label,value:value||'–',note}}

export function buildTeamReport({matches=[],dash={},filters={},matchNames=()=>'',matchScoreText=()=>''}={}){
  const overview=dash.overview||{},k1=dash.k1k2||{},fb=dash.firstball?.total||{},k3=dash.k3?.total||{};
  const rotations=rotationCandidates(dash.rotations||[]);
  const rec=weighted(dash.reception,'posRate'),attack=weighted(dash.attacks,'efficiency');
  const serves=dash.serve||[],serveCount=serves.reduce((a,r)=>a+Number(r.n||0),0);
  const serveBreak=serveCount?serves.reduce((a,r)=>a+Number(r.breaks||0),0)*100/serveCount:null;
  const serveErr=serveCount?serves.reduce((a,r)=>a+Number(r.error||0),0)*100/serveCount:null;
  const serveAce=serveCount?serves.reduce((a,r)=>a+Number(r.ace||0),0)*100/serveCount:null;

  const single=matches.length===1?matches[0]:null;
  const rawNames=single?clean(matchNames(single)):'';
  const own=single?clean(single.ownTeamName||single.fullState?.quickOwnName||rawNames.split(' – ')[0]||'Eigenes Team'):'';
  const opponent=single?clean(single.oppTeamName||single.fullState?.quickOppName||rawNames.split(' – ').slice(1).join(' – ')||'Gegner'):'';
  const title=single?`${own} – ${opponent}`:`Team-Analyse · ${matches.length} Spiele`;
  const rawDate=single?clean(single.matchDate||''):[filters?.From,filters?.To].filter(Boolean).join(' bis ');
  const formatDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return value||'–';const [y,m,d]=value.split('-');return `${d}.${m}.${y}`};
  const date=single?formatDate(rawDate):rawDate;
  const score=single?clean(matchScoreText(single)):'';
  const matchType=single?clean(single.matchTypeName||single.fullState?.matchTypeName||''):'';
  const matchFinished=!!(single?.matchComplete||single?.fullState?.matchComplete);
  const subtitle=[date,score].filter(Boolean).join(' · ');
  const meta=single?[
    {label:'Datum',value:date||'–'},
    {label:'Gegner',value:opponent||'–'},
    {label:matchFinished?'Ergebnis':'Spielstand',value:score||'–'},
    ...(matchType?[{label:'Spielart',value:matchType}]:[])
  ]:[{label:'Zeitraum',value:rawDate||'–'},{label:'Spiele',value:String(matches.length)}];

  const strengths=[],focus=[],training=[];
  const best=rotations.slice().sort((a,b)=>Number(b.points||0)-Number(a.points||0))[0];
  const worst=rotations.slice().sort((a,b)=>Number(a.points||0)-Number(b.points||0))[0];

  if(best&&best.balanceRate>0)addUnique(strengths,{title:`${best.rotation} war stabil`,text:`In ${best.rotation} haben wir insgesamt mehr Rallys gewonnen als verloren (${best.points>=0?'+':''}${best.points} bei ${best.rallies} Rallys).`});
  if(num(k1.k2Break)!=null&&num(k1.k1Sideout)!=null&&num(k1.k2Break)>=num(k1.k1Sideout)+10)addUnique(strengths,{title:'Druck bei eigenem Aufschlag',text:`Bei eigenem Aufschlag haben wir ${displayPct(k1.k2Break)} der Rallys gewonnen. Das war stärker als unser Sideout.`});
  if(serveBreak!=null&&serveBreak>=55)addUnique(strengths,{title:'Aufschlag hat Wirkung erzeugt',text:`Nach unserem Aufschlag haben wir ${pct(serveBreak)} der Rallys gewonnen. Ass und Fehler werden dabei getrennt betrachtet.`});
  if(rec!=null&&num(k1.k1Sideout)!=null&&rec>=45&&num(k1.k1Sideout)>=45)addUnique(strengths,{title:'Gute Annahmen konnten wir nutzen',text:`${pct(rec)} der erfassten Annahmen waren positiv/perfekt; unser Sideout lag bei ${displayPct(k1.k1Sideout)}.`});
  if(attack!=null&&attack>20)addUnique(strengths,{title:'Angriff mit positiver Wirkung',text:`Die erfasste Angriffseffizienz lag bei ${pct(attack)}.`});

  if(worst&&worst.balanceRate<0)addUnique(focus,{title:`${worst.rotation} braucht Aufmerksamkeit`,text:`In ${worst.rotation} haben wir ${Math.abs(Number(worst.points||0))} Rallys mehr verloren als gewonnen. Das beschreibt die Mannschaftssituation, nicht eine einzelne Spielerin.`});
  const fbN=num(k1.firstBall),soN=num(k1.k1Sideout);
  if(fbN!=null&&soN!=null&&fbN<=soN-10)addUnique(focus,{title:'Ersten Angriff besser nutzen',text:`Unser Sideout lag bei ${displayPct(k1.k1Sideout)}, aber nur ${displayPct(k1.firstBall)} wurden direkt mit dem ersten Angriff beendet. Hier liegt Potenzial in Annahme, Zuspiel und Angriff zusammen.`});
  if(worst&&num(worst.receptionPositive)!=null&&rec!=null&&num(worst.receptionPositive)<=rec-10)addUnique(focus,{title:`Annahme in ${worst.rotation} stabilisieren`,text:`Die positive Annahme in ${worst.rotation} lag mit ${displayPct(worst.receptionPositive)} unter unserem Gesamtwert von ${pct(rec)}.`});
  if(k3.n>=4&&num(k3.winRate)!=null&&num(k3.winRate)<50)addUnique(focus,{title:'Gegenangriff nach Abwehr verbessern',text:`Nach Block/Abwehr haben wir ${displayPct(k3.winRate)} der erkannten Transitionen gewonnen. Wir können den Übergang zum Gegenangriff klarer machen.`});
  if(serveCount>=4&&serveErr!=null&&serveErr>serveAce+10)addUnique(focus,{title:'Aufschlagrisiko besser steuern',text:`Aufschlagfehler ${pct(serveErr)}, Asse ${pct(serveAce)}. Entscheidend ist ein gutes Verhältnis zwischen Druck und Fehlern.`});

  if(focus.some(x=>/Annahme/.test(x.title+x.text)))addUnique(training,{text:'Annahme unter Rotationsbedingungen: Ziel ist ein Ball, mit dem mehrere Angriffsoptionen offenbleiben.'});
  if(focus.some(x=>/ersten Angriff|Sideout|Rotation/.test(x.title+x.text)))addUnique(training,{text:'K1-Kette trainieren: Annahme → klare Zuspielentscheidung → erster Angriff mit definierter Lösung.'});
  if(focus.some(x=>/Gegenangriff|Transition/.test(x.title+x.text)))addUnique(training,{text:'K3/Transition trainieren: nach Block oder Abwehr schnell in eine klare Gegenangriffsstruktur kommen.'});
  if(focus.some(x=>/Aufschlag/.test(x.title+x.text)))addUnique(training,{text:'Aufschlagserie mit Zielzonen und Druckvorgabe trainieren; Fehlerquote und Breakwirkung gemeinsam beobachten.'});
  if(!training.length)addUnique(training,{text:'Die stabilsten Muster aus dem Spiel wiederholen und die schwächste Rotation gezielt unter Druck trainieren.'});

  while(strengths.length<2){
    if(num(overview.rallyRate)!=null)addUnique(strengths,{title:'Gemeinsame Rallyarbeit',text:`Wir haben ${displayPct(overview.rallyRate)} der abgeschlossenen Rallys gewonnen. Das ist unsere Ausgangsbasis für die nächste Einheit.`});
    else break;
  }
  if(!focus.length)addUnique(focus,{title:'Feinjustierung statt Großbaustelle',text:'In den vorliegenden Daten gibt es keine einzelne klar dominante Schwäche. Wir arbeiten gezielt an den kleineren Abweichungen.'});

  const metrics=[
    phraseMetric('Punkt nach gegnerischem Aufschlag (K1 / Sideout)',displayPct(k1.k1Sideout),`${k1.k1Count||0} Rallys`),
    phraseMetric('Direkter Punkt im ersten Angriff (First Ball)',displayPct(k1.firstBall),`${k1.k1Count||0} K1-Rallys`),
    phraseMetric('Punkte bei eigenem Aufschlag (K2 / Break)',displayPct(k1.k2Break),`${k1.k2Count||0} Rallys`),
    phraseMetric('Gegenangriff nach Block/Abwehr (K3)',displayPct(k3.winRate),`${k3.n||0} Transitionen`)
  ];

  const rotationRows=rotations.map(r=>({
    rotation:r.rotation,rallies:r.rallies,balance:Number(r.points||0),
    sideout:r.k1Sideout||'–',firstBall:r.firstBall||'–',breakpoint:r.k2Break||'–'
  }));

  const exportBase=reportExportBase({matches,filters,matchNames,target:'Spielerinnen'});
  return {
    schema:3,title:title||'VolleyTakt Team-Report',subtitle,meta,exportBase,matchCount:matches.length,
    generatedAt:new Date().toISOString(),
    strengths:strengths.slice(0,3),focus:focus.slice(0,3),training:training.slice(0,3),
    metrics,rotations:rotationRows,
    note:'Die Hinweise beschreiben Mannschaftsmuster aus den erfassten Daten. Sie sind keine Bewertung einzelner Spielerinnen und keine Kausalitätsbeweise.'
  };
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function teamReportHtml(report={}){
  const cards=(rows,empty)=>rows?.length?rows.map(x=>`<article><h4>${esc(x.title||'')}</h4><p>${esc(x.text||'')}</p></article>`).join(''):`<article><p>${esc(empty)}</p></article>`;
  return `<article class="team-report">
    <header class="team-report-head"><div class="team-report-head-main"><span class="team-report-brand">VolleyTakt · Team-Report</span><h1>${esc(report.title||'Team-Report')}</h1><p>${esc(report.subtitle||'')}</p><div class="team-report-meta">${(report.meta||[]).map(m=>`<span><small>${esc(m.label)}</small><strong>${esc(m.value)}</strong></span>`).join('')}</div></div><span class="team-report-badge">für Spielerinnen</span></header>
    <section class="team-report-intro"><strong>Unser Spiel in kurzen Worten</strong><p>Was hat als Team funktioniert, wo können wir besser werden und was nehmen wir ins nächste Training mit?</p></section>
    <section class="team-report-columns">
      <div class="team-report-good"><h2>✓ Das lief gut</h2>${cards(report.strengths,'Noch zu wenig Daten für einen klaren Schwerpunkt.')}</div>
      <div class="team-report-focus"><h2>→ Hier können wir besser werden</h2>${cards(report.focus,'Keine eindeutige Schwäche erkennbar.')}</div>
    </section>
    <section class="team-report-training"><h2>🏐 Fokus fürs nächste Training</h2><ol>${(report.training||[]).map(x=>`<li>${esc(x.text||'')}</li>`).join('')}</ol></section>
    <section class="team-report-metrics"><h2>Vier Zahlen zur Einordnung</h2><div>${(report.metrics||[]).map(m=>`<article><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span><small>${esc(m.note||'')}</small></article>`).join('')}</div></section>
    ${(report.rotations||[]).length?`<section class="team-report-rotations"><h2>Rotationen im Überblick</h2><div>${report.rotations.map(r=>`<span><b>${esc(r.rotation)}</b><em class="${r.balance>0?'good':r.balance<0?'bad':'even'}">${r.balance>=0?'+':''}${r.balance}</em><small>${r.rallies} Rallys</small></span>`).join('')}</div><p>Die Zahl zeigt gewonnene minus verlorene Rallys in der jeweiligen Rotation.</p></section>`:''}
    <section class="team-report-glossary"><h2>Begriffe kurz erklärt</h2><dl>${TEAM_REPORT_GLOSSARY.map(g=>`<div><dt>${esc(g.term)}</dt><dd>${esc(g.text)}</dd></div>`).join('')}</dl></section>
    <footer>${esc(report.note||'')}</footer>
  </article>`;
}

export function teamReportText(report={}){
  const lines=[`🏐 VolleyTakt Team-Report`,`*${clean(report.title)}*`,clean(report.subtitle),''];
  lines.push('✅ Das lief gut');
  for(const x of report.strengths||[])lines.push(`• ${clean(x.title)}: ${clean(x.text)}`);
  lines.push('','🎯 Hier können wir besser werden');
  for(const x of report.focus||[])lines.push(`• ${clean(x.title)}: ${clean(x.text)}`);
  lines.push('','🏐 Fokus fürs nächste Training');
  for(const x of report.training||[])lines.push(`• ${clean(x.text)}`);
  lines.push('','📊 Kurzwerte');
  for(const m of report.metrics||[])lines.push(`• ${clean(m.label)}: ${clean(m.value)}${m.note?` (${clean(m.note)})`:''}`);
  lines.push('','ℹ️ Begriffe kurz erklärt');
  for(const g of TEAM_REPORT_GLOSSARY)lines.push(`• ${g.term}: ${g.text}`);
  lines.push('','Hinweis: Mannschaftsmuster aus den erfassten Daten – keine Bewertung einzelner Spielerinnen.');
  return lines.filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n').trim();
}

export function teamReportFileBase(report={}){
  if(report.exportBase)return String(report.exportBase);
  const base=clean(report.title||'VolleyTakt_Teamreport').replace(/[^\p{L}\p{N}._-]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,80);
  return base||'VolleyTakt_Teamreport';
}

export const TEAM_REPORT_GLOSSARY=[
  {term:'R1–R6',text:'unsere sechs Rotationen; die Zahl beschreibt die Rotationssituation mit der Zuspielerin auf der jeweiligen Position.'},
  {term:'K1',text:'wir nehmen den gegnerischen Aufschlag an und versuchen daraus zu punkten.'},
  {term:'K2',text:'wir haben Aufschlag und versuchen den Breakpunkt zu machen.'},
  {term:'K3',text:'nach gegnerischem Angriff kommen wir über Block/Abwehr in den eigenen Gegenangriff.'},
  {term:'Sideout',text:'Punktgewinn nach gegnerischem Aufschlag.'},
  {term:'First Ball',text:'direkter Punkt mit dem ersten eigenen Angriff nach der Annahme.'},
  {term:'Break',text:'Punktgewinn bei eigenem Aufschlag.'}
];

export async function copyTeamReportText(report={}){
  const text=teamReportText(report);
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return text}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return text;
}

function wrapCanvasText(ctx,text,maxWidth){
  const words=clean(text).split(' '),lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word}else line=next}
  if(line)lines.push(line);return lines;
}
function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines=5){
  const lines=wrapCanvasText(ctx,text,maxWidth).slice(0,maxLines);
  lines.forEach((line,i)=>ctx.fillText(i===maxLines-1&&wrapCanvasText(ctx,text,maxWidth).length>maxLines?clampText(line,70)+'…':line,x,y+i*lineHeight));
  return y+lines.length*lineHeight;
}

export async function teamReportPngBlob(report={}){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Bildexport wird von diesem Browser nicht unterstützt.');
  ctx.fillStyle='#07111f';ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle='#0f2035';ctx.fillRect(0,0,1080,190);
  ctx.fillStyle='#38bdf8';ctx.font='700 26px system-ui,sans-serif';ctx.fillText('VOLLEYTAKT · TEAM-REPORT',60,55);
  ctx.fillStyle='#f8fafc';ctx.font='800 42px system-ui,sans-serif';let y=110;y=drawWrapped(ctx,report.title||'Team-Report',60,y,920,48,2);
  ctx.fillStyle='#9fb3c8';ctx.font='24px system-ui,sans-serif';ctx.fillText(clean(report.subtitle),60,170);

  const block=(title,items,x,yy,w)=>{
    ctx.fillStyle='#13243a';ctx.beginPath();ctx.roundRect(x,yy,w,300,18);ctx.fill();
    ctx.fillStyle='#f8fafc';ctx.font='800 28px system-ui,sans-serif';ctx.fillText(title,x+28,yy+44);
    let cy=yy+82;
    ctx.font='600 22px system-ui,sans-serif';
    for(const item of (items||[]).slice(0,3)){
      ctx.fillStyle='#dbeafe';cy=drawWrapped(ctx,`• ${item.title||''}`,x+28,cy,w-56,28,2)+4;
      ctx.fillStyle='#9fb3c8';ctx.font='20px system-ui,sans-serif';cy=drawWrapped(ctx,item.text||'',x+46,cy,w-74,26,3)+12;ctx.font='600 22px system-ui,sans-serif';
    }
  };
  block('✓ DAS LIEF GUT',report.strengths,50,225,475);
  block('→ HIER BESSER WERDEN',report.focus,555,225,475);

  ctx.fillStyle='#13243a';ctx.beginPath();ctx.roundRect(50,550,980,230,18);ctx.fill();
  ctx.fillStyle='#f8fafc';ctx.font='800 28px system-ui,sans-serif';ctx.fillText('🏐 FOKUS FÜRS NÄCHSTE TRAINING',78,596);
  y=638;ctx.font='22px system-ui,sans-serif';
  for(const item of (report.training||[]).slice(0,3)){ctx.fillStyle='#dbeafe';y=drawWrapped(ctx,`• ${item.text||''}`,80,y,900,29,3)+16}

  ctx.fillStyle='#f8fafc';ctx.font='800 28px system-ui,sans-serif';ctx.fillText('VIER ZAHLEN ZUR EINORDNUNG',50,835);
  const metrics=(report.metrics||[]).slice(0,4);
  metrics.forEach((m,i)=>{
    const x=50+i*247;
    ctx.fillStyle='#13243a';ctx.beginPath();ctx.roundRect(x,860,227,180,16);ctx.fill();
    ctx.fillStyle='#f8fafc';ctx.font='800 32px system-ui,sans-serif';ctx.fillText(clean(m.value),x+20,905);
    ctx.fillStyle='#a9bdd1';ctx.font='18px system-ui,sans-serif';drawWrapped(ctx,m.label,x+20,943,187,23,3);
    ctx.fillStyle='#6f8aa4';ctx.font='16px system-ui,sans-serif';ctx.fillText(clean(m.note),x+20,1018);
  });

  ctx.fillStyle='#f8fafc';ctx.font='800 26px system-ui,sans-serif';ctx.fillText('ROTATIONEN · RALLYBILANZ',50,1100);
  const rr=(report.rotations||[]).slice(0,6);
  rr.forEach((r,i)=>{
    const x=50+i*163;
    ctx.fillStyle='#13243a';ctx.beginPath();ctx.roundRect(x,1120,143,100,14);ctx.fill();
    ctx.fillStyle='#f8fafc';ctx.font='800 23px system-ui,sans-serif';ctx.fillText(r.rotation,x+16,1154);
    ctx.fillStyle=r.balance>0?'#4ade80':r.balance<0?'#fb7185':'#cbd5e1';ctx.font='800 25px system-ui,sans-serif';ctx.fillText(`${r.balance>=0?'+':''}${r.balance}`,x+78,1154);
    ctx.fillStyle='#94a3b8';ctx.font='16px system-ui,sans-serif';ctx.fillText(`${r.rallies} Rallys`,x+16,1193);
  });
  ctx.fillStyle='#9fb3c8';ctx.font='700 16px system-ui,sans-serif';ctx.fillText('R1–R6 = Rotationen · K1 = Annahme/Sideout · K2 = eigener Aufschlag/Break · K3 = Gegenangriff nach Block/Abwehr',50,1250);
  ctx.fillStyle='#7890a8';ctx.font='15px system-ui,sans-serif';drawWrapped(ctx,report.note||'',50,1282,980,20,2);
  return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG konnte nicht erzeugt werden.')),'image/png',0.95));
}

export async function downloadTeamReportPng(report={}){
  const blob=await teamReportPngBlob(report),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${teamReportFileBase(report)}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);return true;
}
export async function shareTeamReport(report={}){
  const text=teamReportText(report),title=`VolleyTakt · ${clean(report.title||'Team-Report')}`;
  if(navigator.share){
    try{
      const blob=await teamReportPngBlob(report),file=new File([blob],`${teamReportFileBase(report)}.png`,{type:'image/png'});
      if(navigator.canShare?.({files:[file]})){await navigator.share({title,text,files:[file]});return 'file'}
    }catch(error){if(error?.name==='AbortError')return 'cancelled'}
    await navigator.share({title,text});return 'text';
  }
  await copyTeamReportText(report);return 'copied';
}
