#!/usr/bin/env python3
from pathlib import Path
import re, json, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def need(cond,msg):
    if not cond: errors.append(msg)

# Core release versions
index=(ROOT/'index.html').read_text(encoding='utf-8')
app=(ROOT/'js/app.js').read_text(encoding='utf-8')
analysis_ui=(ROOT/'js/analysis/ui.js').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
update=json.loads((ROOT/'update-manifest.json').read_text(encoding='utf-8'))
need('0.4.1' in index,'index lacks RC6-2')
need("APP_VERSION='0.4.1'" in app,'APP_VERSION not RC6-2')
need("APP_VERSION_ID='0.4.1'" in app,'APP_VERSION_ID not rc6-2')
need('v0.4.1' in sw,'SW cache not RC6-2')
need(manifest.get('name')=='VolleyTakt Live 0.4.1','manifest name not RC6-2')
need(update.get('version')=='0.4.1' and update.get('version_id')=='0.4.1','update manifest not RC6-2')
need('0.4.1 RC3' not in index,'active index still contains RC3')

# Service worker assets must exist (query strings ignored); network root ./ is allowed.
for raw in re.findall(r"['\"](\./[^'\"]+)['\"]", sw):
    path=raw.split('?',1)[0]
    if path=='./': continue
    need((ROOT/path[2:]).exists(),f'SW asset missing: {raw}')

# Static relative JS imports must resolve.
for js in ROOT.joinpath('js').rglob('*.js'):
    txt=js.read_text(encoding='utf-8')
    for spec in re.findall(r"(?:from\s+|import\s*\()\s*['\"](\.[^'\"]+)['\"]",txt):
        target=(js.parent/spec.split('?',1)[0]).resolve()
        need(target.exists(),f'Missing JS import: {js.relative_to(ROOT)} -> {spec}')

# No backup/dead files shipped.
for p in ROOT.rglob('*'):
    if p.is_file() and (p.suffix in {'.bak','.orig','.rej'} or p.name.endswith('~')):
        errors.append(f'Backup/dead file present: {p.relative_to(ROOT)}')

# WOHIN target geometry is the user-defined canonical order.
need('TARGET_TOP_ZONES=[1,6,5,7,8,9,2,3,4]' in app,'TARGET_TOP_ZONES incorrect')
need('TARGET_BOTTOM_ZONES=[4,3,2,9,8,7,5,6,1]' in app,'TARGET_BOTTOM_ZONES incorrect')
need('targetCourtZonesForSide' in app,'target-specific field orientation helper missing')

# Drawer routes: selected nav and rendered body must use one centralized route mapping.
for view,draw in [('match','drawMatch'),('players','drawPlayers'),('teams','drawTeams'),('seasons','drawSeasons'),('rosters','drawRosters'),('data','drawData'),('camera','drawCamera'),('sync','drawSync'),('analysis','analysisController.draw'),('settings','drawSettings')]:
    need(f"{view}:" in app,f'drawer route missing: {view}')
need("body?.replaceChildren()" in app and "data-active-view" in app,'drawer stale-content prevention missing')

# Sync overwrite workflow compact labels and new-version-only gating.
need("cloudIsNewer" in app,'cloud newer comparator missing')
need("data-lib-action=\"cloud-replace\"" in app,'cloud replace action missing')
need("t('sync.cloud.keep')" in app and "t('sync.cloud.take')" in app,'compact cloud decision labels missing')

# UI overlay protection for protocol button.
css=(ROOT/'styles.css').read_text(encoding='utf-8')
need('body.overlay-open #phoneProtocolBtn' in css,'protocol overlay z-layer protection missing')


# RC5-2 timestamp regressions.
need('function persistCurrentEventsIntoArchive()' in app,'timestamp archive persistence helper missing')
need("if(action==='timestamps')editMatchTimestamps(id)" in app,'library times action not wired')
need('.dialog .protocol-insert-grid label' in css,'protocol insert dialog label override missing')
need('min-width:150px!important' in css,'protocol insert fields lack desktop minimum width')

# RC5-2 timestamp pagination and semantic insert controls.
need('function timestampDisplayRows(matchEvents){\n const rows=(matchEvents||[]).filter(isTechniqueEvent),fallback=new Map();' in app,'timestamp editor still truncates technique events')
need('timestampPageSize' in app and "value=\"all\"" in app and "value=\"100\"" in app,'timestamp page-size selector incomplete')
need('timestampPagePrev' in app and 'timestampPageNext' in app,'timestamp pagination controls missing')
need('timestampInsertPlayerLabel' in app and 'playerJerseyForSide' in app,'timestamp WER jersey-aware display missing')
need('timestampTargetOptionsFor' in app and "targetAllowsBothSides(action)" in app and "timestamp.target_own" in app and "timestamp.target_opponent" in app,'timestamp WOHIN side-qualified target options missing')
need('padding-inline:16px!important' in css,'protocol insert dialog right/left safety padding missing')

# RC5-4 timestamp toolbar must have a dedicated grid row and visible controls.
need('grid-template-rows:auto auto auto auto minmax(0,1fr)!important' in css,'timestamp toolbar has no dedicated dialog grid row')
need('.timestamp-editor-toolbar select{' in css and 'visibility:visible!important' in css,'timestamp page-size selector visibility guard missing')
need('.timestamp-pager button{' in css and 'display:inline-flex!important' in css,'timestamp pager visibility guard missing')

# RC6 semantic insert parity and roster prioritization.
need('timestamp.players_on_court' in app and 'timestamp.players_roster' in app,'WER grouping labels missing')
need('matchRosterRows(tid,state.seasonId,state.matchTypeId)' in app,'WER is not restricted to active match roster')
need('timestampPlayerOptionHtml(players)' in app,'shared WER option rendering missing')
need("timestamp.rally_result" in app and "insert_result" in app,'insert dialog rally-result control missing')
need('applyInsertedResult' in app and 'normalizeStoredScores' in app,'inserted rally result/score normalization missing')


# RC6 complete multi-device cloud conflict workflow.
need('function applyCloudMatchLocally' in app,'cloud apply helper missing')
need('function keepLocalMatchAgainstCloud' in app,'keep-local cloud override helper missing')
need('function promptCloudVersionChoice' in app,'cloud decision dialog missing')
need("sync.cloud.choice_help" in app,'cloud decision warning/help missing')
need("{forceLocal:true}" in app,'explicit local-over-cloud takeover missing')
need("archiveCurrentMatch(state.matchComplete?'ended':'active');syncUiState='synced'" in app,'successful live sync does not align local archive timestamp')
need('function localLibraryMatches(){const rows=loadMatchArchive();' in app,'library rendering still mutates local updatedAt')
sync=(ROOT/'js/sync.js').read_text(encoding='utf-8')
need('decideLiveSessionConflict' in sync,'sync conflict decision helper missing')
need("if(!forceLocal&&Number(remoteGeneration||0)>Number(localGeneration||0))return 'remote-newer'" in sync,'newer generation is not detected independently of lease owner')


# RC6-2 analysis hardening.
filters=(ROOT/'js/analysis/filters.js').read_text(encoding='utf-8')
insights=(ROOT/'js/analysis/insights.js').read_text(encoding='utf-8')
result_window=(ROOT/'js/analysis/result-window.js').read_text(encoding='utf-8')
need('DASHBOARD_VIEW_CARDS' in analysis_ui and 'dashboardAllows' in analysis_ui,'context-sensitive dashboard mapping missing')
need('analysis-card-popover' in analysis_ui and 'closePopovers' in analysis_ui,'analysis card info popover missing')
need('analysis-modern-detail' in analysis_ui and 'detailVizHtml' in analysis_ui,'modern analysis detail visualization missing')
need('insightsFor' in analysis_ui and 'rotationInsights' in insights,'local insight engine missing')
need('explicit=!!(from||to||seasonId||teamId||oppId||typeId)' in filters,'analysis date/filter selection does not override pinned match')
need('Keine Spiele im gewählten Zeitraum' in analysis_ui,'empty analysis range must not fall back to current match')
need('compareSummary' in analysis_ui and "filteredMatches('b')" in analysis_ui,'A/B comparison does not use separate filtered match set')
need("const TOUR_VERSION='tour-2'" in app,'tour version is not independently versioned')
need("⏳ Synchronisiere …" in app and "withButtonBusy(btn,()=>runSync(true)" in app,'manual sync busy state missing')
need('wireInsightHelp' in result_window,'detail insight info button not wired')


# RC6-3 schema-6 context migration and deep insight architecture.
storage=(ROOT/'js/storage.js').read_text(encoding='utf-8')
sync=(ROOT/'js/sync.js').read_text(encoding='utf-8')
context_data=(ROOT/'js/data/context.js').read_text(encoding='utf-8')
chains2=(ROOT/'js/analysis/chains2.js').read_text(encoding='utf-8')
context1=(ROOT/'js/analysis/context.js').read_text(encoding='utf-8')
advanced=(ROOT/'js/analysis/insights-advanced.js').read_text(encoding='utf-8')
need('CURRENT_DATA_SCHEMA=6' in storage,'data schema is not 6')
need("MIGRATION_BACKUPS_KEY='volleytakt-migration-backups-v1'" in storage,'persistent migration backup store missing')
need("else if(next===6)" in storage and 'contextMap:mapping' in storage,'schema 5->6 context migration/mapping missing')
need('normalizeContextEvents' in storage and 'legacy_event_id' in context_data,'legacy event/context normalization missing')
need('buildContextChains' in chains2,'ANALYSIS-CHAIN2 module missing')
need('buildContextReport' in context1 and 'byRotation' in context1 and 'byReceptionQuality' in context1,'ANALYSIS-CONTEXT1 comparisons missing')
need('advancedInsightsFor' in advanced and 'Annahme' in advanced and 'First-Ball' in advanced,'advanced context insight layer missing')
need("dataSchema:6" in sync and "analysisContextSchema:1" in sync and "schema:2,dataSchema:6" in sync,'cloud schema-6 propagation missing')
need("./js/data/context.js" in sw and "./js/analysis/chains2.js" in sw and "./js/analysis/context.js" in sw and "./js/analysis/insights-advanced.js" in sw,'RC6-3 analysis modules missing from offline cache')
need('Migrationsbackup herunterladen' in app and 'downloadLatestMigrationBackup' in app,'migration backup download UI missing')


# RC6-4 completed volleyball analysis and scout-quality display order.
deep=(ROOT/'js/analysis/deep.js').read_text(encoding='utf-8')
need('analyzeServeSemantic' in deep and 'inPlayRate' in deep,'ANALYSIS-SERVE1 semantic partition missing')
need('analyzeK3' in deep and "['Block','Abwehr']" in deep,'ANALYSIS-K3 transition detector missing')
need('analyzeRotationsDeep' in deep and 'k3WinRate' in deep and 'firstAttackKill' in deep,'ANALYSIS-ROT1 missing')
need('analyzeFirstBallDeep' in deep and 'byReception' in deep,'ANALYSIS-FIRSTBALL1 missing')
need('analyzeSetDeep' in deep and 'recQ' in deep and 'rallyWinRate' in deep,'ANALYSIS-SET1 missing')
need('analyzeAttackDeep' in deep and 'tempo' in deep and 'efficiency' in deep,'ANALYSIS-ATTACK1 missing')
need('analyzeReceptionDeep' in deep and 'setTargets' in deep,'ANALYSIS-RECEPTION1 missing')
need('analyzeBlockDefense' in deep and 'transitionWinRate' in deep,'ANALYSIS-BLOCKDEF1 missing')
need('analyzePlayerDeep' in deep and "K3:{n:0,w:0}" in deep,'ANALYSIS-PLAYER1 missing')
need('analyzeOpponentDeep' in deep and 'oppWinRate' in deep,'ANALYSIS-OPP1 missing')
need('analyzeChainPatterns' in deep,'ANALYSIS-CHAIN3 missing')
need('analyzeTargets' in deep and 'successRate' in deep,'ANALYSIS-TARGET1 missing')
need('compareDeep' in analysis_ui and 'deltaLabel' in analysis_ui,'ANALYSIS-COMPARE2 delta UI missing')
need('analysis-confidence-legend' in analysis_ui and 'n &lt; 4' in analysis_ui,'ANALYSIS-CONFIDENCE2 legend missing')
need("view==='k3'" in advanced and "view==='blockdef'" in advanced and "view==='targets'" in advanced,'ANALYSIS-INSIGHT3 coverage missing')
need('Für Trainer' in result_window and 'openTrainerReport' in result_window,'trainer report action missing')
need("const QUALITY_PROFILES={basic_5:['=','-','0','+','#']" in app,'basic quality semantic profile changed unexpectedly')
need("const BASIC_QUALITY_BUTTON_ORDER=['+','#','0','-','=']" in app,'requested basic quality visual order missing')
need('return BASIC_QUALITY_BUTTON_ORDER' in app,'basic quality display does not use requested order')
need("./js/analysis/deep.js" in sw,'deep analysis module missing from offline cache')
need('CURRENT_DATA_SCHEMA=6' in storage,'RC6-4 must keep data schema 6')


# RC6-5 library metadata editing / explicit match date.
library_meta=(ROOT/'js/library/metadata.js').read_text(encoding='utf-8')
need('libraryDisplayDate' in library_meta and 'createdAt' not in library_meta.split('libraryDisplayDate',1)[1].split('}',1)[0],'DATA-MATCHDATE1 must not derive display date from createdAt')
need('applyMatchMetadata' in library_meta and "'matchDate'" in library_meta,'metadata patch helper missing')
need('data-lib-action="edit-meta"' in app and 'library-edit-meta' in app,'compact pencil metadata action missing before library date')
need("if(action==='edit-meta')editLibraryMatchMetadata(id)" in app,'metadata edit action not wired')
need('function editLibraryMatchMetadata(matchId)' in app,'library metadata edit dialog missing')
need('Spieldatum' in app and 'Scoutingaktionen, Rallys, Zeitstempel' in app,'metadata editor preservation warning missing')
need('applyMatchMetadata(snap,patch,updatedAt)' in app,'metadata edits do not use preservation helper')
need("if(state.matchId===matchId&&!state.matchComplete)await runLiveSync(false)" in app,'active edited match not propagated through live sync')
need('await syncStoredMatch(getMatchSnapshot(matchId)||next' in app,'stored edited match not propagated to cloud')
need('.library-edit-meta' in css and 'width:26px' in css,'compact pencil styling missing')
need("./js/library/metadata.js" in sw,'library metadata module missing from offline cache')
need('CURRENT_DATA_SCHEMA=6' in storage,'RC6-5 must keep data schema 6')


# RC6-6 player-friendly team report and share/export.
team_report=(ROOT/'js/analysis/team-report.js').read_text(encoding='utf-8')
need('buildTeamReport' in team_report and 'Das lief gut' in team_report and 'Fokus fürs nächste Training' in team_report,'ANALYSIS-REPORT2 team report structure missing')
need('teamReportText' in team_report and 'copyTeamReportText' in team_report,'ANALYSIS-SHARE1 text export missing')
need('teamReportPngBlob' in team_report and '1080' in team_report and '1350' in team_report,'ANALYSIS-SHARE1 PNG export missing')
need('shareTeamReport' in team_report and 'navigator.share' in team_report,'ANALYSIS-SHARE1 Web Share missing')
need('data-analysis-team-report' in analysis_ui,'team report action missing from analysis dashboard')
need('teamReport:report' in analysis_ui and 'trainerReport:coach' in analysis_ui and 'schema:3' in analysis_ui,'saved analysis does not retain both reports')
need('PDF / Drucken' in result_window and 'PNG speichern' in result_window and 'Text kopieren' in result_window,'team report export actions incomplete')
need('ensure();root.hidden=false;teamReport=report' in result_window,'team report window is created but remains hidden')
need("./js/analysis/team-report.js" in sw,'team report module missing from offline cache')
need('CURRENT_DATA_SCHEMA=6' in storage,'RC6-6 must keep data schema 6')


need('Report erzeugen' in analysis_ui,'dashboard report action not renamed')
need('openDashboardReports' in analysis_ui,'dashboard report branching missing')
need('Für Spielerinnen' in result_window and 'Für Trainer' in result_window,'report target chooser missing')
need('analysisReportBack' in result_window and 'teamReportBack' in result_window and 'trainerReportBack' in result_window,'one-level back navigation missing')
need("reportMenuReturn==='normal'?restoreResult():close()" in result_window,'report menu back target is not preserved')
need('root.hidden=false;teamReport=report' in result_window,'team report window visibility regression')
need('team-report-meta' in team_report and "label:'Datum'" in team_report and "label:'Gegner'" in team_report and "matchFinished?'Ergebnis':'Spielstand'" in team_report,'player report header metadata missing')


# RC6-8 report architecture.
trainer_report=(ROOT/'js/analysis/trainer-report.js').read_text(encoding='utf-8')
report_export=(ROOT/'js/analysis/report-export.js').read_text(encoding='utf-8')
need('buildTrainerReport' in trainer_report and 'trainerReportHtml' in trainer_report,'ANALYSIS-REPORT3 module missing')
need('Wichtigste Erkenntnisse' in trainer_report and 'Trainingsableitung' in trainer_report and 'Spielerinnen im Kontext' in trainer_report,'ANALYSIS-REPORT3 content incomplete')
need('Analyse – Dashboard' not in trainer_report,'trainer report must not reproduce dashboard')
need('reportExportBase' in report_export and 'printWithSuggestedFilename' in report_export,'ANALYSIS-SHARE2 export naming missing')
need("target:'Spielerinnen'" in team_report and "target:'Trainer'" in analysis_ui,'target-specific export names missing')
need('report-menu-mode' in css and 'clamp(520px,65vw,780px)' in css,'UI-REPORT1 compact chooser missing')
need('openTrainerReport' in result_window and 'trainerReportHtml' in result_window,'dedicated trainer report window missing')
need("./js/analysis/trainer-report.js" in sw and "./js/analysis/report-export.js" in sw,'RC6-8 report modules missing from offline cache')
need('CURRENT_DATA_SCHEMA=6' in storage,'RC6-8 must keep data schema 6')
need("playerContext:compute('playerContext'" in analysis_ui,'ANALYSIS-REPORT3A player context not included in report data')
need("dash.playerContext" in trainer_report,'ANALYSIS-REPORT3A trainer player phases still use shallow player data')
need("'nicht erfasst'" in trainer_report,'ANALYSIS-REPORT3A missing-opponent semantics missing')
need("matchFinished?'Ergebnis':'Spielstand'" in trainer_report and "matchFinished?'Ergebnis':'Spielstand'" in team_report,'REPORT-FORMAT1 match status/result semantics missing')
need('font-variant-ligatures:none!important' in css and '.trainer-report,.team-report' in css,'REPORT-FORMAT1 ligature/print text fix missing')
need('display:block!important' in css and 'team-report-glossary dl' in css,'REPORT-PRINT1 print flow/glossary compaction missing')
need('trainer PDF pagination/contrast fix' in css and 'break-inside:auto!important' in css and '.trainer-report-summary span' in css,'trainer print pagination/contrast fix missing')


# RC6-8 report composition redesign.
need('analysisReportTrainerShort' in result_window and 'analysisReportTrainerDetail' in result_window,'REPORT-TRAINER1 chooser buttons missing')
need("openTrainerReport(trainerReport,'short')" in result_window and "openTrainerReport(trainerReport,'detail')" in result_window,'REPORT-TRAINER1 chooser wiring missing')
need('trainerShortReportHtml' in result_window and 'trainerShortReportHtml' in trainer_report,'trainer short report renderer missing')
need('trainer-report-detail' in trainer_report and 'trainer-report-short' in trainer_report,'trainer report variants missing')
need('REPORT-LAYOUT1' in css and 'grid-template-areas:' in css and 'width:198mm!important' in css,'REPORT-LAYOUT1 A4 tile composition missing')
need('.analysis-result-backdrop.team-report-mode .team-report' in css and '"training metrics"' in css and '"rotations glossary"' in css,'REPORT-PLAYER1 one-page player tile layout missing')
need('font-size:8.25pt!important' in css,'REPORT-PLAYER1 readable compact print typography missing')
need('.trainer-report-short' in css and '"priority phase"' in css and '"tech training"' in css,'REPORT-TRAINER1 one-page short layout missing')
need('.trainer-report-detail' in css and 'grid-template-columns:1fr 1fr!important' in css,'REPORT-TRAINER1 compact detail layout missing')


# RC6-8 final report finishing.
report_export=(ROOT/'js/analysis/report-export.js').read_text(encoding='utf-8')
need('@bottom-left' in report_export and 'counter(page)' in report_export and 'counter(pages)' in report_export,'REPORT-PRINT2 app-owned page numbering missing')
need('@bottom-right' in report_export and 'formatGeneratedAt' in report_export,'REPORT-PRINT2 generated timestamp footer missing')
need('margin:0 6mm 9mm 6mm' in report_export and '@top-left{content:none}' in report_export,'REPORT-PRINT2 top header suppression missing')
need('copyTrainerReportText' in result_window and 'downloadTrainerReportPng' in result_window and 'shareTrainerReport' in result_window,'REPORT-SHARE2A trainer actions not wired')
need('trainerReportCopy' in result_window and 'trainerReportPng' in result_window and 'trainerReportShare' in result_window,'REPORT-SHARE2A trainer controls missing')
need('trainerReportText' in trainer_report and 'trainerReportPngBlob' in trainer_report and 'shareTrainerReport' in trainer_report,'REPORT-SHARE2A trainer export helpers missing')
need('displayPct(overview.rallyRate)' in trainer_report and 'displayPct(worst.receptionPositive)' in trainer_report,'REPORT-FORMAT1A remaining trainer decimal formats missing')
need('REPORT-TYPO1' in css and 'font-size:7.15pt!important' in css and 'font-size:7.85pt!important' in css,'REPORT-TYPO1 print typography tuning missing')

if errors:
    print('Static release check FAILED')
    for e in errors: print(' -',e)
    sys.exit(1)

# RC6 menu/dashboard structure.
need('grid-template-columns:clamp(150px,18vw,205px)' in css,'RC6 side navigation layout missing')
need('analysis-dashboard-grid' in css and 'auto-fit' in css and 'minmax' in css,'responsive analysis dashboard grid missing')
need('analysisDashboardHtml' in analysis_ui,'analysis dashboard renderer missing')
need("data-analysis-detail-view" in analysis_ui,'analysis dashboard detail actions missing')
print('Static release check OK: RC6 versions, complete cloud takeover workflow, SW assets/imports, WOHIN geometry, drawer routes and timestamp regressions verified.')
