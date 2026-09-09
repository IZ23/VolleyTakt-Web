import {teamReportHtml,copyTeamReportText,downloadTeamReportPng,shareTeamReport,teamReportFileBase} from './team-report.js';
import {trainerReportHtml,trainerShortReportHtml,copyTrainerReportText,downloadTrainerReportPng,shareTrainerReport} from './trainer-report.js';
import {printWithSuggestedFilename} from './report-export.js';
function activateSection(root,key='all'){
  root.querySelectorAll('[data-analysis-section]').forEach(button=>button.classList.toggle('selected',button.dataset.analysisSection===key));
  root.querySelectorAll('.analysis-detail-section').forEach(section=>{section.hidden=key!=='all'&&section.dataset.analysisDetail!==key});
}


function nativeShareUiAvailable(){
  if(typeof navigator==='undefined'||typeof navigator.share!=='function')return false;
  const ua=String(navigator.userAgent||'');
  const mobileHint=navigator.userAgentData?.mobile===true;
  const mobileUa=/Android|iPhone|iPad|iPod/i.test(ua);
  const iPadDesktopUa=navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints||0)>1;
  return mobileHint||mobileUa||iPadDesktopUa;
}

export function createResultWindow(){
  let root=null,onAccept=()=>{},normalContent='',normalTitle='',normalSubtitle='',teamReport=null,trainerReport=null,teamStatus='',hasNormalView=false,reportMenuReturn='close';
  const close=()=>{if(root)root.hidden=true};
  const setError=message=>{const el=root?.querySelector('#analysisResultError');if(!el)return;el.textContent=message||'';el.hidden=!message};
  const setTeamStatus=message=>{teamStatus=message||'';const el=root?.querySelector('#teamReportStatus');if(el){el.textContent=teamStatus;el.hidden=!teamStatus}};
  const wireSectionNavigation=()=>root.querySelectorAll('[data-analysis-section]').forEach(button=>button.onclick=()=>activateSection(root,button.dataset.analysisSection));
  const wireInsightHelp=()=>root.querySelectorAll('.analysis-insight-info').forEach(button=>button.onclick=()=>{const box=button.closest('.analysis-insights')?.querySelector('.analysis-insight-explain');if(box)box.hidden=!box.hidden;});
  const ensure=()=>{if(root)return root;root=document.createElement('div');root.className='analysis-result-backdrop';root.hidden=true;root.innerHTML='<section class="analysis-result-window" role="dialog" aria-modal="true" aria-labelledby="analysisResultTitle"><header><div><h2 id="analysisResultTitle">Analyseergebnis</h2><p id="analysisResultSubtitle"></p><p id="analysisResultError" class="analysis-result-error" hidden></p></div></header><main id="analysisResultWindowBody"></main><footer id="analysisResultActions"></footer></section>';document.body.appendChild(root);return root};
  const setMode=mode=>{root.classList.remove('print-preview-mode','team-report-mode','trainer-report-mode','report-menu-mode','trainer-short-mode');if(mode)root.classList.add(mode)};

  const reportMenuHtml=()=>`<section class="analysis-report-menu"><h3>Report erzeugen</h3><p>Wähle die Zielgruppe. Alle Ausgaben verwenden dieselbe gefilterte Datenbasis; Trainerreports gibt es als Kurz- oder Detailfassung.</p><div class="analysis-report-choice-grid"><button type="button" id="analysisReportPlayers" class="analysis-report-player-card"><strong>Für Spielerinnen</strong><span>Kurz, verständlich und handlungsorientiert. Mit Stärken, Verbesserungsfeldern, Trainingsfokus und Begriffshilfe.</span></button><section class="analysis-report-trainer-card"><strong>Für Trainer</strong><span>Priorisierte Erkenntnisse, Interpretationen, Spielphasen, Rotationen, Kontext und Trainingsableitung.</span><div class="analysis-report-trainer-actions"><button type="button" id="analysisReportTrainerShort">Kurzreport</button><button type="button" id="analysisReportTrainerDetail">Detailreport</button></div></section></div></section>`;

  const openReportMenu=({report=teamReport,trainer=trainerReport,returnTo=null}={})=>{
    ensure();root.hidden=false;teamReport=report||teamReport;trainerReport=trainer||trainerReport;reportMenuReturn=returnTo|| (hasNormalView?'normal':'close');
    setMode('report-menu-mode');
    root.querySelector('#analysisResultTitle').textContent='Report erzeugen';
    root.querySelector('#analysisResultSubtitle').textContent='Für wen soll der Report aufbereitet werden?';
    root.querySelector('#analysisResultWindowBody').innerHTML=reportMenuHtml();
    root.querySelector('#analysisResultActions').innerHTML='<button id="analysisReportBack">Zurück</button>';
    root.querySelector('#analysisReportBack').onclick=()=>reportMenuReturn==='normal'?restoreResult():close();
    root.querySelector('#analysisReportPlayers').onclick=()=>openTeamReport(teamReport);
    root.querySelector('#analysisReportTrainerShort').onclick=()=>openTrainerReport(trainerReport,'short');
    root.querySelector('#analysisReportTrainerDetail').onclick=()=>openTrainerReport(trainerReport,'detail');
    setError('');
  };

  const reportActionsHtml=()=>`<button id="teamReportBack">Zurück</button><button id="teamReportPrint" class="primary">PDF / Drucken</button><button id="teamReportCopy">Text kopieren</button><button id="teamReportPng">PNG speichern</button>${nativeShareUiAvailable()?'<button id="teamReportShare">Teilen</button>':''}`;
  const wireTeamActions=()=>{
    const back=root.querySelector('#teamReportBack'),print=root.querySelector('#teamReportPrint'),copy=root.querySelector('#teamReportCopy'),png=root.querySelector('#teamReportPng'),share=root.querySelector('#teamReportShare');
    if(back)back.onclick=()=>openReportMenu({report:teamReport,trainer:trainerReport,returnTo:reportMenuReturn});
    if(print)print.onclick=()=>printWithSuggestedFilename(teamReport?.exportBase||teamReportFileBase(teamReport),{generatedAt:teamReport?.generatedAt});
    if(copy)copy.onclick=async()=>{copy.disabled=true;try{await copyTeamReportText(teamReport);setTeamStatus('Team-Report als Text kopiert.')}catch(error){setTeamStatus(`Kopieren fehlgeschlagen: ${error?.message||error}`)}finally{copy.disabled=false}};
    if(png)png.onclick=async()=>{png.disabled=true;try{await downloadTeamReportPng(teamReport);setTeamStatus(`PNG gespeichert: ${teamReportFileBase(teamReport)}.png`)}catch(error){setTeamStatus(`PNG-Export fehlgeschlagen: ${error?.message||error}`)}finally{png.disabled=false}};
    if(share)share.onclick=async()=>{share.disabled=true;try{const mode=await shareTeamReport(teamReport);if(mode==='copied')setTeamStatus('Teilen wird vom Browser nicht unterstützt; der Text wurde kopiert.');else if(mode!=='cancelled')setTeamStatus('Team-Report an die Teilen-Funktion übergeben.')}catch(error){setTeamStatus(`Teilen fehlgeschlagen: ${error?.message||error}`)}finally{share.disabled=false}};
  };

  const openTeamReport=report=>{
    if(!report)return;
    ensure();root.hidden=false;teamReport=report;teamStatus='';setMode('team-report-mode');
    root.querySelector('#analysisResultTitle').textContent='Team-Report für Spielerinnen';
    root.querySelector('#analysisResultSubtitle').textContent='Kurz, verständlich und handlungsorientiert – ohne Trainer-Rohdaten.';
    root.querySelector('#analysisResultWindowBody').innerHTML=`${teamReportHtml(report)}<p id="teamReportStatus" class="team-report-status" hidden></p>`;
    root.querySelector('#analysisResultActions').innerHTML=reportActionsHtml();
    wireTeamActions();setError('');
  };

  const openTrainerReport=(report,variant='detail')=>{
    if(!report)return;
    ensure();root.hidden=false;trainerReport=report;setMode('trainer-report-mode');
    const short=variant==='short',suffix=short?'Kurz':'Detail',base=`${report.exportBase||'VolleyTakt_Trainer'}_${suffix}`;
    root.classList.toggle('trainer-short-mode',short);
    root.querySelector('#analysisResultTitle').textContent=short?'Trainer-Kurzreport':'Trainer-Detailreport';
    root.querySelector('#analysisResultSubtitle').textContent=short?'Kompakter Arbeitsreport auf eine A4-Seite optimiert.':'Ausführlicher Analysebericht mit Kontext und Trainingsableitung.';
    root.querySelector('#analysisResultWindowBody').innerHTML=`${short?trainerShortReportHtml(report):trainerReportHtml(report)}<p id="trainerReportStatus" class="team-report-status" hidden></p>`;
    root.querySelector('#analysisResultActions').innerHTML=`<button id="trainerReportBack">Zurück</button><button id="trainerReportPrint" class="primary">PDF / Drucken</button><button id="trainerReportCopy">Text kopieren</button><button id="trainerReportPng">PNG speichern</button>${nativeShareUiAvailable()?'<button id="trainerReportShare">Teilen</button>':''}`;
    const status=message=>{const el=root.querySelector('#trainerReportStatus');if(el){el.textContent=message||'';el.hidden=!message}};
    root.querySelector('#trainerReportBack').onclick=()=>{root.classList.remove('trainer-short-mode');openReportMenu({report:teamReport,trainer:trainerReport,returnTo:reportMenuReturn})};
    root.querySelector('#trainerReportPrint').onclick=()=>printWithSuggestedFilename(base,{generatedAt:report.generatedAt});
    root.querySelector('#trainerReportCopy').onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{await copyTrainerReportText(report,variant);status('Trainerreport als Text kopiert.')}catch(error){status(`Kopieren fehlgeschlagen: ${error?.message||error}`)}finally{b.disabled=false}};
    root.querySelector('#trainerReportPng').onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{await downloadTrainerReportPng(report,variant,base);status(`PNG gespeichert: ${base}.png`)}catch(error){status(`PNG-Export fehlgeschlagen: ${error?.message||error}`)}finally{b.disabled=false}};
    const shareButton=root.querySelector('#trainerReportShare');
    if(shareButton)shareButton.onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{const mode=await shareTrainerReport(report,variant,base);if(mode==='copied')status('Teilen wird vom Browser nicht unterstützt; der Text wurde kopiert.');else if(mode!=='cancelled')status('Trainerreport an die Teilen-Funktion übergeben.')}catch(error){status(`Teilen fehlgeschlagen: ${error?.message||error}`)}finally{b.disabled=false}};
    setError('');
  };

  const restoreResult=()=>{
    setMode('');
    root.querySelector('#analysisResultTitle').textContent=normalTitle;
    root.querySelector('#analysisResultSubtitle').textContent=normalSubtitle;
    root.querySelector('#analysisResultWindowBody').innerHTML=normalContent;
    root.querySelector('#analysisResultActions').innerHTML=`<button id="analysisResultCancel">Schließen</button><button id="analysisResultOk" class="primary">Ergebnis speichern</button>${teamReport&&trainerReport?'<button id="analysisResultReport">Report erzeugen</button>':''}`;
    wireMainActions();wireSectionNavigation();wireInsightHelp()
  };

  const accept=async()=>{const button=root.querySelector('#analysisResultOk');if(!button||button.disabled)return;const old=button.textContent;button.disabled=true;button.classList.add('is-busy');button.textContent='⌛ Speichern …';setError('');try{await onAccept();close()}catch(error){setError(error?.message||String(error));button.disabled=false;button.classList.remove('is-busy');button.textContent=old}};
  const wireMainActions=()=>{
    const cancel=root.querySelector('#analysisResultCancel'),ok=root.querySelector('#analysisResultOk'),report=root.querySelector('#analysisResultReport');
    if(cancel)cancel.onclick=close;if(ok)ok.onclick=accept;if(report)report.onclick=()=>openReportMenu({report:teamReport,trainer:trainerReport,returnTo:'normal'})
  };

  const open=({title,subtitle='',content,accept:acceptHandler,teamReport:report=null,trainerReport:coach=null})=>{
    ensure();normalTitle=title;normalSubtitle=subtitle;normalContent=content;onAccept=acceptHandler||(()=>{});teamReport=report||null;trainerReport=coach||null;hasNormalView=true;root.hidden=false;restoreResult();setError('')
  };
  const openDashboardReports=({report,trainer})=>{
    ensure();teamReport=report||null;trainerReport=trainer||null;hasNormalView=false;openReportMenu({report:teamReport,trainer:trainerReport,returnTo:'close'})
  };
  return {open,close,openTeamReport,openTrainerReport,openReportMenu,openDashboardReports};
}
