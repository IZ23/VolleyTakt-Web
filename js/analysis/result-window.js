import {teamReportHtml,copyTeamReportText,downloadTeamReportPng,shareTeamReport,teamReportFileBase} from './team-report.js';
import {trainerReportHtml,trainerShortReportHtml,copyTrainerReportText,downloadTrainerReportPng,shareTrainerReport} from './trainer-report.js';
import {printWithSuggestedFilename} from './report-export.js';
import {playerReportHtml,copyPlayerReportText,downloadPlayerReportPng,sharePlayerReport} from './player-report.js';
import {openActionPlaylist} from './action-video.js';
import {localizeReportMarkup,rt,setReportLanguage,getReportLanguage} from './report-language.js';
import {getLanguage,t} from '../i18n.js';
function activateSection(root,key='all'){
  root.querySelectorAll('[data-analysis-section]').forEach(button=>button.classList.toggle('selected',button.dataset.analysisSection===key));
  root.querySelectorAll('.analysis-detail-section').forEach(section=>{section.hidden=key!=='all'&&section.dataset.analysisDetail!==key});
}


export function nativeShareUiAvailable(){
  if(typeof navigator==='undefined'||typeof navigator.share!=='function')return false;
  const ua=String(navigator.userAgent||'');
  const mobileHint=navigator.userAgentData?.mobile===true;
  const mobileUa=/Android|iPhone|iPad|iPod/i.test(ua);
  const iPadDesktopUa=navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints||0)>1;
  const touchTablet=Number(navigator.maxTouchPoints||0)>1&&((typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches)||/Linux|MacIntel/i.test(String(navigator.platform||'')));
  return mobileHint||mobileUa||iPadDesktopUa||touchTablet;
}

export function createResultWindow(){
  let root=null,onAccept=()=>{},normalContent='',normalTitle='',normalSubtitle='',teamReport=null,trainerReport=null,playerReports=[],videoSelection=null,teamStatus='',hasNormalView=false,reportMenuReturn='close',reportLanguage=getLanguage();
  const close=()=>{if(root)root.hidden=true};
  const setError=message=>{const el=root?.querySelector('#analysisResultError');if(!el)return;el.textContent=message||'';el.hidden=!message};
  const setTeamStatus=message=>{teamStatus=message||'';const el=root?.querySelector('#teamReportStatus');if(el){el.textContent=teamStatus;el.hidden=!teamStatus}};
  const wireSectionNavigation=()=>root.querySelectorAll('[data-analysis-section]').forEach(button=>button.onclick=()=>activateSection(root,button.dataset.analysisSection));
  const wireInsightHelp=()=>root.querySelectorAll('.analysis-insight-info').forEach(button=>button.onclick=()=>{const box=button.closest('.analysis-insights')?.querySelector('.analysis-insight-explain');if(box)box.hidden=!box.hidden;});
  const ensure=()=>{if(root)return root;root=document.createElement('div');root.className='analysis-result-backdrop';root.hidden=true;root.innerHTML='<section class="analysis-result-window" role="dialog" aria-modal="true" aria-labelledby="analysisResultTitle"><header><div><h2 id="analysisResultTitle">Analyseergebnis</h2><p id="analysisResultSubtitle"></p><p id="analysisResultError" class="analysis-result-error" hidden></p></div></header><main id="analysisResultWindowBody"></main><footer id="analysisResultActions"></footer></section>';document.body.appendChild(root);return root};
  const setMode=mode=>{root.classList.remove('print-preview-mode','team-report-mode','trainer-report-mode','report-menu-mode','trainer-short-mode');if(mode)root.classList.add(mode)};

  const reportMenuHtml=()=>`<section class="analysis-report-menu"><div class="analysis-report-language"><label for="analysisReportLanguage"><strong>${t('report.language')}</strong></label><select id="analysisReportLanguage"><option value="de" ${reportLanguage==='de'?'selected':''}>${t('report.german')}</option><option value="en" ${reportLanguage==='en'?'selected':''}>${t('report.english')}</option></select><small>${t('report.languageHelp')}</small></div><h3>${t('report.createTitle')}</h3><p>${t('report.chooseAudience')}</p><div class="analysis-report-choice-grid"><button type="button" id="analysisReportPlayers" class="analysis-report-player-card"><strong>${t('report.team')}</strong><span>${t('report.teamDesc')}</span></button><section class="analysis-report-personal-card"><strong>${t('report.personal')}</strong><span>${t('report.personalDescLong')}</span><div class="analysis-report-personal-actions"><select id="analysisPersonalPlayer">${playerReports.map((r,i)=>`<option value="${i}">${r.playerName}</option>`).join('')}</select><button type="button" id="analysisReportPersonal" ${playerReports.length?'':'disabled'}>${t('report.openPersonal')}</button></div></section><section class="analysis-report-trainer-card"><strong>${t('report.forCoach')}</strong><span>${t('report.forCoachDesc')}</span><div class="analysis-report-trainer-actions"><button type="button" id="analysisReportTrainerShort">${t('report.short')}</button><button type="button" id="analysisReportTrainerDetail">${t('report.detail')}</button></div></section></div></section>`;

  const openReportMenu=({report=teamReport,trainer=trainerReport,returnTo=null}={})=>{
    ensure();root.hidden=false;teamReport=report||teamReport;trainerReport=trainer||trainerReport;reportMenuReturn=returnTo|| (hasNormalView?'normal':'close');
    setReportLanguage(reportLanguage);
    setMode('report-menu-mode');
    root.querySelector('#analysisResultTitle').textContent=t('report.createTitle');
    root.querySelector('#analysisResultSubtitle').textContent=t('report.forWhom');
    root.querySelector('#analysisResultWindowBody').innerHTML=reportMenuHtml();
    root.querySelector('#analysisResultActions').innerHTML=`<button id="analysisReportBack">${t('common.back')}</button>`;
    root.querySelector('#analysisReportBack').onclick=()=>reportMenuReturn==='normal'?restoreResult():close();
    const languageSelect=root.querySelector('#analysisReportLanguage');if(languageSelect)languageSelect.onchange=()=>{reportLanguage=languageSelect.value==='en'?'en':'de';setReportLanguage(reportLanguage)};
    root.querySelector('#analysisReportPlayers').onclick=()=>{setReportLanguage(reportLanguage);openTeamReport(teamReport)};
    const personal=root.querySelector('#analysisReportPersonal');if(personal)personal.onclick=()=>{const i=Number(root.querySelector('#analysisPersonalPlayer')?.value||0);setReportLanguage(reportLanguage);openPlayerReport(playerReports[i])};
    root.querySelector('#analysisReportTrainerShort').onclick=()=>{setReportLanguage(reportLanguage);openTrainerReport(trainerReport,'short')};
    root.querySelector('#analysisReportTrainerDetail').onclick=()=>{setReportLanguage(reportLanguage);openTrainerReport(trainerReport,'detail')};
    setError('');
  };

  const reportActionsHtml=()=>`<button id="teamReportBack">${t('report.back')}</button><button id="teamReportPrint" class="primary">${t('report.print')}</button><button id="teamReportCopy">${t('report.copy')}</button><button id="teamReportPng">${t('report.png')}</button>${nativeShareUiAvailable()?`<button id="teamReportShare">${t('report.share')}</button>`:''}`;
  const wireTeamActions=()=>{
    const back=root.querySelector('#teamReportBack'),print=root.querySelector('#teamReportPrint'),copy=root.querySelector('#teamReportCopy'),png=root.querySelector('#teamReportPng'),share=root.querySelector('#teamReportShare');
    if(back)back.onclick=()=>openReportMenu({report:teamReport,trainer:trainerReport,returnTo:reportMenuReturn});
    if(print)print.onclick=()=>printWithSuggestedFilename(teamReport?.exportBase||teamReportFileBase(teamReport),{generatedAt:teamReport?.generatedAt});
    if(copy)copy.onclick=async()=>{copy.disabled=true;try{await copyTeamReportText(teamReport);setTeamStatus(t('report.teamCopied'))}catch(error){setTeamStatus(t('report.copyFailed',{error:error?.message||error}))}finally{copy.disabled=false}};
    if(png)png.onclick=async()=>{png.disabled=true;try{await downloadTeamReportPng(teamReport);setTeamStatus(t('report.pngSaved',{name:`${teamReportFileBase(teamReport)}.png`}))}catch(error){setTeamStatus(t('report.pngFailed',{error:error?.message||error}))}finally{png.disabled=false}};
    if(share)share.onclick=async()=>{share.disabled=true;try{const mode=await shareTeamReport(teamReport);if(mode==='copied')setTeamStatus(t('report.shareFallback'));else if(mode!=='cancelled')setTeamStatus(t('report.teamShared'))}catch(error){setTeamStatus(t('report.shareFailed',{error:error?.message||error}))}finally{share.disabled=false}};
  };

  const openTeamReport=report=>{
    if(!report)return;
    ensure();root.hidden=false;teamReport=report;teamStatus='';setMode('team-report-mode');
    root.querySelector('#analysisResultTitle').textContent=t('report.teamPlayers');
    root.querySelector('#analysisResultSubtitle').textContent=t('report.teamPlayersDesc');
    root.querySelector('#analysisResultWindowBody').innerHTML=`${teamReportHtml(report)}<p id="teamReportStatus" class="team-report-status" hidden></p>`;
    root.querySelector('#analysisResultActions').innerHTML=reportActionsHtml();
    wireTeamActions();setError('');
  };

  const openPlayerReport=report=>{
    if(!report)return;
    ensure();root.hidden=false;setMode('team-report-mode');
    root.querySelector('#analysisResultTitle').textContent=t('report.personal');
    root.querySelector('#analysisResultSubtitle').textContent=`${t('report.personalDesc')} · ${report.playerName}`;
    root.querySelector('#analysisResultWindowBody').innerHTML=`${playerReportHtml(report)}<p id="playerReportStatus" class="team-report-status" hidden></p>`;
    root.querySelector('#analysisResultActions').innerHTML=`<button id="playerReportBack">${t('report.back')}</button><button id="playerReportPrint" class="primary">${t('report.print')}</button><button id="playerReportCopy">${t('report.copy')}</button><button id="playerReportPng">${t('report.png')}</button>${nativeShareUiAvailable()?`<button id="playerReportShare">${t('report.share')}</button>`:''}`;
    const status=message=>{const el=root.querySelector('#playerReportStatus');if(el){el.textContent=message||'';el.hidden=!message}};
    root.querySelector('#playerReportBack').onclick=()=>openReportMenu({report:teamReport,trainer:trainerReport,returnTo:reportMenuReturn});
    root.querySelector('#playerReportPrint').onclick=()=>printWithSuggestedFilename(report.exportBase||'VolleyTakt_Spielerinnenreport',{generatedAt:report.generatedAt});
    root.querySelector('#playerReportCopy').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await copyPlayerReportText(report);status(t('report.personalCopied'))}catch(error){status(t('report.copyFailed',{error:error?.message||error}))}finally{b.disabled=false}};
    root.querySelector('#playerReportPng').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await downloadPlayerReportPng(report);status(t('report.pngSavedSimple'))}catch(error){status(t('report.pngFailed',{error:error?.message||error}))}finally{b.disabled=false}};
    const share=root.querySelector('#playerReportShare');if(share)share.onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const mode=await sharePlayerReport(report);if(mode==='copied')status(t('report.shareFallback'));else if(mode!=='cancelled')status(t('report.personalShared'))}catch(error){status(t('report.shareFailed',{error:error?.message||error}))}finally{b.disabled=false}};
    setError('');
  };

  const openTrainerReport=(report,variant='detail')=>{
    if(!report)return;
    ensure();root.hidden=false;trainerReport=report;setMode('trainer-report-mode');
    const short=variant==='short',suffix=short?'Kurz':'Detail',base=`${report.exportBase||'VolleyTakt_Trainer'}_${suffix}`;
    root.classList.toggle('trainer-short-mode',short);
    root.querySelector('#analysisResultTitle').textContent=short?t('report.trainerShort'):t('report.trainerDetail');
    root.querySelector('#analysisResultSubtitle').textContent=short?t('report.trainerShortDesc'):t('report.trainerDetailDesc');
    root.querySelector('#analysisResultWindowBody').innerHTML=`${short?trainerShortReportHtml(report):trainerReportHtml(report)}<p id="trainerReportStatus" class="team-report-status" hidden></p>`;
    root.querySelector('#analysisResultActions').innerHTML=`<button id="trainerReportBack">${t('report.back')}</button><button id="trainerReportPrint" class="primary">${t('report.print')}</button><button id="trainerReportCopy">${t('report.copy')}</button><button id="trainerReportPng">${t('report.png')}</button>${nativeShareUiAvailable()?`<button id="trainerReportShare">${t('report.share')}</button>`:''}`;
    const status=message=>{const el=root.querySelector('#trainerReportStatus');if(el){el.textContent=message||'';el.hidden=!message}};
    root.querySelector('#trainerReportBack').onclick=()=>{root.classList.remove('trainer-short-mode');openReportMenu({report:teamReport,trainer:trainerReport,returnTo:reportMenuReturn})};
    root.querySelector('#trainerReportPrint').onclick=()=>printWithSuggestedFilename(base,{generatedAt:report.generatedAt});
    root.querySelector('#trainerReportCopy').onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{await copyTrainerReportText(report,variant);status(t('report.trainerCopied'))}catch(error){status(t('report.copyFailed',{error:error?.message||error}))}finally{b.disabled=false}};
    root.querySelector('#trainerReportPng').onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{await downloadTrainerReportPng(report,variant,base);status(t('report.pngSaved',{name:`${base}.png`}))}catch(error){status(t('report.pngFailed',{error:error?.message||error}))}finally{b.disabled=false}};
    const shareButton=root.querySelector('#trainerReportShare');
    if(shareButton)shareButton.onclick=async event=>{const b=event.currentTarget;b.disabled=true;try{const mode=await shareTrainerReport(report,variant,base);if(mode==='copied')status(t('report.shareFallback'));else if(mode!=='cancelled')status(t('report.trainerShared'))}catch(error){status(t('report.shareFailed',{error:error?.message||error}))}finally{b.disabled=false}};
    setError('');
  };

  const restoreResult=()=>{
    setMode('');
    root.querySelector('#analysisResultTitle').textContent=normalTitle;
    root.querySelector('#analysisResultSubtitle').textContent=normalSubtitle;
    root.querySelector('#analysisResultWindowBody').innerHTML=normalContent;
    root.querySelector('#analysisResultActions').innerHTML=`<button id="analysisResultCancel">${t('common.close')}</button><button id="analysisResultOk" class="primary">${t('report.saveResult')}</button>${videoSelection?.clips?.some(c=>c.playable)?`<button id="analysisResultVideo">${t('report.videoSequences')}</button>`:''}${videoSelection?.clips?.length?`<button id="analysisResultCreateVideo">${t('report.createVideo')}</button>`:''}${teamReport&&trainerReport?`<button id="analysisResultReport">${t('analysis.report')}</button>`:''}`;
    wireMainActions();wireSectionNavigation();wireInsightHelp()
  };

  const accept=async()=>{const button=root.querySelector('#analysisResultOk');if(!button||button.disabled)return;const old=button.textContent;button.disabled=true;button.classList.add('is-busy');button.textContent=t('common.saving');setError('');try{await onAccept();close()}catch(error){setError(error?.message||String(error));button.disabled=false;button.classList.remove('is-busy');button.textContent=old}};
  const wireMainActions=()=>{
    const cancel=root.querySelector('#analysisResultCancel'),ok=root.querySelector('#analysisResultOk'),report=root.querySelector('#analysisResultReport'),video=root.querySelector('#analysisResultVideo'),createVideo=root.querySelector('#analysisResultCreateVideo');
    if(cancel)cancel.onclick=close;if(ok)ok.onclick=accept;if(video)video.onclick=()=>openActionPlaylist(videoSelection,0);if(createVideo)createVideo.onclick=()=>window.dispatchEvent(new CustomEvent('volleytakt:create-video',{detail:{selection:videoSelection}}));if(report)report.onclick=()=>{reportLanguage=getLanguage();setReportLanguage(reportLanguage);openReportMenu({report:teamReport,trainer:trainerReport,returnTo:'normal'})}
  };

  const open=({title,subtitle='',content,accept:acceptHandler,teamReport:report=null,trainerReport:coach=null,playerReports:personal=[],videoSelection:videos=null})=>{
    ensure();normalTitle=title;normalSubtitle=subtitle;normalContent=content;onAccept=acceptHandler||(()=>{});teamReport=report||null;trainerReport=coach||null;playerReports=personal||[];videoSelection=videos||null;hasNormalView=true;root.hidden=false;restoreResult();setError('')
  };
  const openDashboardReports=({report,trainer,players=[]})=>{
    ensure();teamReport=report||null;trainerReport=trainer||null;playerReports=players||[];hasNormalView=false;reportLanguage=getLanguage();setReportLanguage(reportLanguage);openReportMenu({report:teamReport,trainer:trainerReport,returnTo:'close'})
  };
  return {open,close,openTeamReport,openPlayerReport,openTrainerReport,openReportMenu,openDashboardReports};
}
