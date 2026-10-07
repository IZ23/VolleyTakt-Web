const KEY='volleytakt-analysis-results-v1';
const safeParse=raw=>{try{return JSON.parse(raw)||[]}catch{return []}};
export function loadAnalysisResults(){return safeParse(localStorage.getItem(KEY)||'[]')}
export function saveAnalysisResult(record){const rows=loadAnalysisResults(),i=rows.findIndex(x=>x.id===record.id);if(i>=0)rows[i]=record;else rows.unshift(record);localStorage.setItem(KEY,JSON.stringify(rows.slice(0,40)));return rows.slice(0,40)}
export function analysisResultId(view,filters){const raw=JSON.stringify({view,filters});let hash=2166136261;for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619)}return `analysis_${(hash>>>0).toString(16)}`}
export function latestAnalysisResult(view){return loadAnalysisResults().find(x=>x.view===view)||null}
