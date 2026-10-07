import {localizeReport,localizeReportMarkup,rt,getReportLanguage} from './report-language.js';
import {t} from '../i18n.js';
// VolleyTakt Live 0.4.2 RC1 · ANALYSIS-PLAYER-REPORT1 / ANALYSIS-PLAYER-REPORT2
// Personal player report based on the same filtered events used by analysis.
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?`${(100*a/b).toFixed(1).replace('.',',')} %`:'–';
const nameOf=p=>clean(`${p?.firstName||''} ${p?.lastName||''}`)||clean(p?.name||p?.abbreviation||'Spielerin');
const actionName=e=>clean(e?.action||'Aktion');
const q=e=>clean(e?.value||'');
const KNOWN_QUALITIES=['#','+','0','!','/','-','='];
export const PLAYER_REPORT_GLOSSARY=[
 {term:'R1–R6',text:'unsere sechs Rotationen; die Zahl beschreibt die Rotationssituation mit der Zuspielerin auf der jeweiligen Position.'},
 {term:'K1',text:'wir nehmen den gegnerischen Aufschlag an und versuchen daraus zu punkten.'},
 {term:'K2',text:'wir haben Aufschlag und versuchen den Breakpunkt zu machen.'},
 {term:'K3',text:'nach gegnerischem Angriff kommen wir über Block/Abwehr in den eigenen Gegenangriff.'},
 {term:'Sideout',text:'Punktgewinn nach gegnerischem Aufschlag.'},
 {term:'First Ball',text:'direkter Punkt mit dem ersten eigenen Angriff nach der Annahme.'},
 {term:'Break',text:'Punktgewinn bei eigenem Aufschlag.'},
 {term:'Qualität # / +',text:'perfekte bzw. positive Aktionswirkung entsprechend dem für die Aktion verwendeten VolleyTakt-Bewertungsprofil.'},
 {term:'Qualität 0 / ! / /',text:'Zwischenbewertungen können je nach verwendetem Bewertungsprofil und Technik neutral, eingeschränkt oder technikspezifisch sein. Im persönlichen Report wird für die Gruppierung die bei der Aktion gespeicherte Qualitätsstufe berücksichtigt; die Originalbewertung bleibt zusätzlich sichtbar.'},
 {term:'Qualität = / −',text:'Fehler bzw. negative Aktionswirkung. Die Bewertung der Einzelaktion ist vom Rally-Ergebnis getrennt.'},
 {term:'ohne WIE',text:'Aktionen, für die keine Qualitätsbewertung gespeichert ist. Sie zählen zur Zahl der erfassten Aktionen, aber nicht zu positiv, neutral/eingeschränkt oder negativ/Fehler.'}
];
function qualityBucket(e={}){
  const value=q(e);if(!value)return 'unrated';
  const raw=e?.quality_level,level=raw===''||raw==null?NaN:Number(raw);
  if(Number.isFinite(level)){if(level>=4)return 'positive';if(level<=2)return 'negative';return 'neutral'}
  if(['#','+'].includes(value))return 'positive';
  if(['0','!'].includes(value))return 'neutral';
  if(value==='/'&&actionName(e)==='Aufschlag')return 'positive';
  if(['=','-','/'].includes(value))return 'negative';
  return 'unrated';
}
function emptyQualityCounts(){return Object.fromEntries(KNOWN_QUALITIES.map(v=>[v,0]))}
function distributionText(counts={},unrated=0){const parts=KNOWN_QUALITIES.filter(k=>counts[k]>0).map(k=>`${k}: ${counts[k]}`);if(unrated)parts.push(`ohne WIE: ${unrated}`);return parts.join(' · ')||'keine WIE-Bewertung'}
function byAction(events=[]){
  const m=new Map();for(const e of events){const a=actionName(e);if(!a)continue;const r=m.get(a)||{action:a,n:0,positive:0,negative:0,neutral:0,unrated:0,qualityCounts:emptyQualityCounts()};r.n++;const value=q(e),bucket=qualityBucket(e);if(KNOWN_QUALITIES.includes(value))r.qualityCounts[value]++;if(bucket==='positive')r.positive++;else if(bucket==='negative')r.negative++;else if(bucket==='neutral')r.neutral++;else r.unrated++;m.set(a,r)}
  return [...m.values()].map(r=>({...r,error:r.negative,positiveRate:pct(r.positive,r.n),neutralRate:pct(r.neutral,r.n),errorRate:pct(r.negative,r.n),unratedRate:pct(r.unrated,r.n),rated:r.n-r.unrated,balance:r.positive-r.negative,distribution:distributionText(r.qualityCounts,r.unrated)})).sort((a,b)=>b.n-a.n);
}
function byRotation(events=[]){const m=new Map();for(const e of events){const r=e.rotation||'–',x=m.get(r)||{rotation:r,n:0,positive:0,negative:0,neutral:0,unrated:0};x.n++;const bucket=qualityBucket(e);if(bucket==='positive')x.positive++;else if(bucket==='negative')x.negative++;else if(bucket==='neutral')x.neutral++;else x.unrated++;m.set(r,x)}return [...m.values()].map(x=>({...x,error:x.negative,positiveRate:pct(x.positive,x.n),neutralRate:pct(x.neutral,x.n),errorRate:pct(x.negative,x.n),balance:x.positive-x.negative})).sort((a,b)=>String(a.rotation).localeCompare(String(b.rotation),'de'))}
export function buildPlayerReport({player,events=[],matches=[],filters={},matchNames=()=>''}={}){
  const rows=byAction(events),rots=byRotation(events),summary={actions:events.length,positive:0,neutral:0,negative:0,unrated:0,qualityCounts:emptyQualityCounts()};
  for(const e of events){const value=q(e),bucket=qualityBucket(e);if(KNOWN_QUALITIES.includes(value))summary.qualityCounts[value]++;if(bucket==='positive')summary.positive++;else if(bucket==='negative')summary.negative++;else if(bucket==='neutral')summary.neutral++;else summary.unrated++}
  summary.errors=summary.negative;summary.rated=summary.actions-summary.unrated;summary.positiveRate=pct(summary.positive,summary.actions);summary.neutralRate=pct(summary.neutral,summary.actions);summary.errorRate=pct(summary.negative,summary.actions);summary.unratedRate=pct(summary.unrated,summary.actions);summary.distribution=distributionText(summary.qualityCounts,summary.unrated);
  const strengthCandidates=rows.filter(r=>r.n>=3&&r.positive>0&&r.positive>r.negative).sort((a,b)=>(b.positive/b.n-a.positive/a.n)||(b.balance-a.balance)||(b.n-a.n));
  const focusCandidates=rows.filter(r=>r.n>=3&&r.negative>0).sort((a,b)=>(b.negative/b.n-a.negative/a.n)||(a.balance-b.balance)||(b.n-a.n));
  const best=strengthCandidates[0],focus=focusCandidates[0];
  const from=filters?.From||'',to=filters?.To||'',single=matches.length===1?matches[0]:null,period=single?`${single.matchDate||'–'} · ${clean(matchNames(single))}`:[from,to].filter(Boolean).join(' bis ')||`${matches.length} Spiele`;
  const title=`${nameOf(player)} · Persönlicher Spielerinnenreport`;
  return {playerId:player?.id||'',playerName:nameOf(player),title,subtitle:period,generatedAt:new Date().toISOString(),exportBase:`VolleyTakt_Spielerinnenreport_${nameOf(player).replace(/[^\p{L}\p{N}._-]+/gu,'_')}`,
    meta:[{label:'Zeitraum / Spiele',value:period},{label:'Spiele',value:String(matches.length)},{label:'erfasste Aktionen',value:String(events.length)}],
    summary,techniques:rows,rotations:rots,
    strengths:best?[{title:`${best.action} als individuelle Stärke`,text:`Bei ${best.n} erfassten ${best.action}-Aktionen wurden ${best.positiveRate} positiv oder perfekt bewertet; ${best.neutralRate} lagen im neutralen/eingeschränkten und ${best.errorRate} im negativen/fehlerhaften Bereich.${best.unrated?` ${best.unrated} Aktion(en) enthalten keine WIE-Bewertung.`:''}`}]:[],
    focus:focus?[{title:`${focus.action} weiterentwickeln`,text:`Bei ${focus.n} erfassten ${focus.action}-Aktionen lagen ${focus.errorRate} im negativen/fehlerhaften Bereich; ${focus.positiveRate} waren positiv/perfekt und ${focus.neutralRate} neutral/eingeschränkt.${focus.unrated?` ${focus.unrated} Aktion(en) enthalten keine WIE-Bewertung.`:''} Die Kennzahlen beschreiben die erfassten Aktionen im ausgewählten Zeitraum und keine allgemeine Bewertung der Spielerin.`}]:[],
    note:'Die Auswertung beschreibt ausschließlich die in VolleyTakt erfassten Aktionen im gewählten Zeitraum. Sie zeigt Zusammenhänge und Trainingshinweise, aber keine bewiesenen Ursachen. Einzelaktionsqualität und Rally-Ergebnis bleiben fachlich getrennt.'};
}
const pr=(key,params={})=>t(key,params,getReportLanguage());
const localizePlayerReport=r=>localizeReport(r,getReportLanguage());

export function playerReportHtml(r={}){
  r=localizePlayerReport(r);
  const glossary=localizeReport(PLAYER_REPORT_GLOSSARY,getReportLanguage());
  const cards=(rows,empty)=>rows?.length?rows.map(x=>`<article><h4>${esc(x.title)}</h4><p>${esc(x.text)}</p></article>`).join(''):`<article><p>${esc(empty)}</p></article>`;
  const meta=(r.meta||[]).map(m=>`<span><small>${esc(m.label)}</small><strong>${esc(m.value)}</strong></span>`).join('');
  const unratedLabel=r.summary?.unrated?pr('report.personal.unratedCount',{count:r.summary.unrated}):pr('report.personal.allRated');
  const rotationRows=(r.rotations||[]).map(x=>{
    const unrated=x.unrated?pr('report.personal.rotationUnrated',{count:x.unrated}):'';
    const details=pr('report.personal.rotationRow',{count:x.n,neutral:x.neutral,unrated});
    return `<span><b>${esc(x.rotation)}</b><em class="${x.balance>0?'good':x.balance<0?'bad':'even'}">${x.balance>=0?'+':''}${x.balance}</em><small>${esc(details)}</small></span>`;
  }).join('')||`<p>${esc(pr('report.personal.noRotation'))}</p>`;
  return `<article class="team-report player-report"><header class="team-report-head"><div class="team-report-head-main"><span class="team-report-brand">${esc(pr('report.personal.brand'))}</span><h1>${esc(r.playerName)}</h1><p>${esc(r.subtitle)}</p><div class="team-report-meta">${meta}</div></div><span class="team-report-badge">${esc(pr('report.personal.badge'))}</span></header>
  <section class="team-report-intro"><strong>${esc(pr('report.personal.introTitle'))}</strong><p>${esc(pr('report.personal.introBody',{player:r.playerName}))}</p></section>
  <section class="team-report-metrics"><h2>${esc(pr('report.personal.metricsTitle'))}</h2><div><article><strong>${esc(r.summary?.actions)}</strong><span>${esc(pr('report.personal.actions'))}</span><small>${esc(unratedLabel)}</small></article><article><strong>${esc(r.summary?.positiveRate)}</strong><span>${esc(pr('report.personal.positivePerfect'))}</span><small>${esc(pr('report.personal.highQuality'))}</small></article><article><strong>${esc(r.summary?.neutralRate)}</strong><span>${esc(pr('report.personal.neutralLimited'))}</span><small>${esc(pr('report.personal.intermediate'))}</small></article><article><strong>${esc(r.summary?.errorRate)}</strong><span>${esc(pr('report.personal.negativeError'))}</span><small>${esc(pr('report.personal.lowQuality'))}</small></article></div><p class="player-report-quality-total">${esc(pr('report.personal.overallDistribution',{distribution:r.summary?.distribution||'–'}))}</p></section>
  <section class="team-report-columns"><div class="team-report-good"><h2>${esc(pr('report.personal.strengthTitle'))}</h2>${cards(r.strengths,pr('report.personal.noStrength'))}</div><div class="team-report-focus"><h2>${esc(pr('report.personal.focusTitle'))}</h2>${cards(r.focus,pr('report.personal.noFocus'))}</div></section>
  <section class="player-report-table"><h2>${esc(pr('report.personal.skillsTitle'))}</h2><p class="player-report-table-help">${esc(pr('report.personal.skillsHelp'))}</p><div class="analysis-table-wrap"><table class="data-table compact"><thead><tr><th>${esc(pr('report.personal.skill'))}</th><th>${esc(pr('report.personal.actions'))}</th><th>${esc(pr('report.personal.distribution'))}</th><th>${esc(pr('report.personal.positive'))}</th><th>${esc(pr('report.personal.neutralShort'))}</th><th>${esc(pr('report.personal.negative'))}</th><th>${esc(pr('report.personal.unrated'))}</th></tr></thead><tbody>${(r.techniques||[]).map(x=>`<tr><td>${esc(x.action)}</td><td>${x.n}</td><td class="player-quality-distribution">${esc(x.distribution)}</td><td>${esc(x.positiveRate)}</td><td>${esc(x.neutralRate)}</td><td>${esc(x.errorRate)}</td><td>${x.unrated}</td></tr>`).join('')||`<tr><td colspan="7">${esc(pr('report.personal.noActions'))}</td></tr>`}</tbody></table></div></section>
  <section class="team-report-rotations"><h2>${esc(pr('report.personal.rotationsTitle'))}</h2><div>${rotationRows}</div><p>${esc(pr('report.personal.balanceNote'))}</p></section>
  <section class="team-report-glossary"><h2>${esc(pr('report.personal.glossaryTitle'))}</h2><dl>${glossary.map(g=>`<div><dt>${esc(g.term)}</dt><dd>${esc(g.text)}</dd></div>`).join('')}</dl></section><footer>${esc(r.note)}</footer></article>`;
}

export function playerReportText(r={}){
  r=localizePlayerReport(r);
  const glossary=localizeReport(PLAYER_REPORT_GLOSSARY,getReportLanguage());
  const lines=[pr('report.personal.brand'),r.playerName,r.subtitle,'',
    pr('report.personal.metricLine',{actions:r.summary?.actions,positive:r.summary?.positiveRate,neutral:r.summary?.neutralRate,negative:r.summary?.errorRate}),
    pr('report.personal.qualityLine',{distribution:r.summary?.distribution||'–'}),'',pr('report.personal.skillsTitle')];
  for(const x of r.techniques||[])lines.push(`• ${x.action}: ${x.n} ${pr('report.personal.actions').toLowerCase()} · ${x.distribution} · ${pr('report.personal.positive')} ${x.positiveRate} · ${pr('report.personal.neutralShort')} ${x.neutralRate} · ${pr('report.personal.negative')} ${x.errorRate}`);
  lines.push('',pr('report.personal.strengthTitle').replace(/^✓\s*/,''));
  for(const x of r.strengths||[])lines.push(`• ${x.title}: ${x.text}`);
  if(!(r.strengths||[]).length)lines.push(`• ${pr('report.personal.noStrength')}`);
  lines.push('',pr('report.personal.focusTitle').replace(/^→\s*/,''));
  for(const x of r.focus||[])lines.push(`• ${x.title}: ${x.text}`);
  if(!(r.focus||[]).length)lines.push(`• ${pr('report.personal.noFocus')}`);
  lines.push('',pr('report.personal.glossaryTitle'));
  for(const g of glossary)lines.push(`• ${g.term}: ${g.text}`);
  lines.push('',r.note||'');
  return lines.join('\n').trim();
}
export async function copyPlayerReportText(r={}){const text=playerReportText(r);if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return text}const a=document.createElement('textarea');a.value=text;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();return text}
export async function playerReportPngBlob(r={}){
  r=localizePlayerReport(r);
  const c=document.createElement('canvas');c.width=1080;c.height=1500;const x=c.getContext('2d');if(!x)throw new Error(pr('report.personal.pngUnsupported'));
  x.fillStyle='#07111f';x.fillRect(0,0,c.width,c.height);x.fillStyle='#0e7490';x.fillRect(0,0,c.width,190);x.fillStyle='#fff';x.font='800 38px system-ui,sans-serif';x.fillText(r.playerName||pr('report.personal.playerFallback'),55,80);x.fillStyle='#dbeafe';x.font='20px system-ui,sans-serif';x.fillText(pr('report.personal.brand'),55,120);x.fillText(String(r.subtitle||''),55,155);let y=245;
  const section=(title,lines)=>{x.fillStyle='#13243a';x.beginPath();x.roundRect(45,y,990,80+lines.length*52,18);x.fill();x.fillStyle='#fff';x.font='800 26px system-ui,sans-serif';x.fillText(title,70,y+42);x.font='20px system-ui,sans-serif';x.fillStyle='#dbeafe';lines.forEach((line,i)=>x.fillText(String(line).slice(0,90),78,y+82+i*52));y+=100+lines.length*52};
  section(pr('report.personal.metricsTitle'),[pr('report.personal.metricLine',{actions:r.summary?.actions,positive:r.summary?.positiveRate,neutral:r.summary?.neutralRate,negative:r.summary?.errorRate}),pr('report.personal.qualityLine',{distribution:r.summary?.distribution||'–'})]);
  section(pr('report.personal.skillsTitle'),(r.techniques||[]).slice(0,6).map(v=>`${v.action}: ${v.n} · ${v.distribution}`));
  section(pr('report.personal.strengthTitle').replace(/^✓\s*/,''),(r.strengths||[]).length?(r.strengths||[]).map(a=>`${a.title}: ${a.text}`):[pr('report.personal.noStrength')]);
  section(pr('report.personal.focusTitle').replace(/^→\s*/,''),(r.focus||[]).length?(r.focus||[]).map(a=>`${a.title}: ${a.text}`):[pr('report.personal.noFocus')]);
  x.fillStyle='#8ba3b9';x.font='16px system-ui,sans-serif';x.fillText(pr('report.personal.dataNote'),55,c.height-55);
  return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error(pr('report.personal.pngFailed'))),'image/png',.95));
}
export async function downloadPlayerReportPng(r={}){const b=await playerReportPngBlob(r),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`${r.exportBase||'VolleyTakt_Spielerinnenreport'}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200)}
export async function sharePlayerReport(r={}){const text=playerReportText(r),title=`VolleyTakt · ${r.playerName||pr('report.personal.playerFallback')}`;if(navigator.share){try{const b=await playerReportPngBlob(r),f=new File([b],`${r.exportBase||'VolleyTakt_Spielerinnenreport'}.png`,{type:'image/png'});if(navigator.canShare?.({files:[f]})){await navigator.share({title,text,files:[f]});return 'file'}}catch(e){if(e?.name==='AbortError')return 'cancelled'}await navigator.share({title,text});return 'text'}await copyPlayerReportText(r);return 'copied'}
