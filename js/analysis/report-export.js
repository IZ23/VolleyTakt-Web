// VolleyTakt Live · ANALYSIS-SHARE2
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
export const safeFilePart=value=>clean(value)
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^A-Za-z0-9ÄÖÜäöüß._-]+/g,'-')
  .replace(/-+/g,'-').replace(/^[-_.]+|[-_.]+$/g,'').slice(0,64)||'unbekannt';

export function reportExportBase({matches=[],filters={},matchNames=()=>'',target='Report'}={}){
  const single=matches.length===1?matches[0]:null;
  if(single){
    const raw=clean(matchNames(single));
    const own=clean(single.ownTeamName||single.fullState?.quickOwnName||raw.split(' – ')[0]||'Eigenes-Team');
    const opp=clean(single.oppTeamName||single.fullState?.quickOppName||raw.split(' – ').slice(1).join(' – ')||'Gegner');
    const date=String(single.matchDate||'').slice(0,10)||'ohne-Datum';
    return `VolleyTakt_${safeFilePart(date)}_${safeFilePart(own)}_vs_${safeFilePart(opp)}_${safeFilePart(target)}`;
  }
  const from=String(filters?.From||'').slice(0,10),to=String(filters?.To||'').slice(0,10);
  const range=from&&to?(from===to?from:`${from}_bis_${to}`):(from||to||'Zeitraum');
  const team=clean(filters?.Team||'Team');
  return `VolleyTakt_${safeFilePart(range)}_${safeFilePart(team)}_${safeFilePart(target)}`;
}

const escapeCssString=value=>String(value??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,' ');
export const formatGeneratedAt=value=>{
  const d=value?new Date(value):new Date();
  if(Number.isNaN(d.getTime()))return '';
  return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d).replace(',',' ·');
};

export function printWithSuggestedFilename(base,{generatedAt=null}={}){
  const previous=document.title;
  const title=String(base||'VolleyTakt_Report');
  document.title=title;

  // REPORT-PRINT2: VolleyTakt owns the print footer. Modern Chromium supports
  // @page margin boxes including page/pages counters. A zero top page margin
  // leaves no printable area for the browser's own URL/title header.
  const stamp=formatGeneratedAt(generatedAt);
  const style=document.createElement('style');
  style.id='volleytakt-print-page-meta';
  style.textContent=`@media print{
    @page{
      size:A4 portrait;
      margin:0 6mm 9mm 6mm;
      @top-left{content:none}
      @top-center{content:none}
      @top-right{content:none}
      @bottom-left{
        content:"Seite " counter(page) " von " counter(pages);
        font:7pt system-ui,sans-serif;color:#64748b
      }
      @bottom-right{
        content:"${escapeCssString(stamp)}";
        font:7pt system-ui,sans-serif;color:#64748b
      }
    }
  }`;
  document.head.appendChild(style);

  const restore=()=>{
    document.title=previous;
    style.remove();
    window.removeEventListener('afterprint',restore);
  };
  window.addEventListener('afterprint',restore,{once:true});
  window.print();
  setTimeout(()=>{if(document.title===title)restore()},30000);
}
