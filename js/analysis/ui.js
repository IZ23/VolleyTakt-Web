export function optionHtml(rows,{selected='',label=x=>x.name,escapeHtml=x=>String(x??'')}={}){
  return '<option value="">Alle</option>'+(rows||[]).map(x=>`<option value="${escapeHtml(x.id)}" ${x.id===selected?'selected':''}>${escapeHtml(label(x))}</option>`).join('');
}

export function filterBlockHtml({prefix,title,compare=false,minDate='',maxDate='',seasons=[],teams=[],matchTypes=[],players=[],actions=[],rotations=[],selectedTeamId='',escapeHtml=x=>String(x??'')}){
  const opts=(rows,selected='',label=x=>x.name)=>optionHtml(rows,{selected,label,escapeHtml});
  return `<div class="analysis-filter${compare?' compare':''}"><div class="analysis-filter-shell"><div class="analysis-filter-title"><span>⌕</span><strong>${title}</strong></div><div class="analysis-filter-grid"><label>Von <input id="${prefix}From" type="date" value="${escapeHtml(minDate)}"></label><label>Bis <input id="${prefix}To" type="date" value="${escapeHtml(maxDate)}"></label><label>Saison <select id="${prefix}Season">${opts(seasons)}</select></label><label>Team <select id="${prefix}Team">${opts(teams,selectedTeamId)}</select></label><label>Gegner <select id="${prefix}Opponent">${opts(teams)}</select></label><label>Spielart <select id="${prefix}Type">${opts(matchTypes)}</select></label><label class="analysis-player-filter">Spielerin <select id="${prefix}Player" title="Spielerin auswählen">${opts(players,'',x=>`${x.abbreviation} · ${x.firstName} ${x.lastName}`)}</select></label><label class="analysis-technique-filter">Technik <select id="${prefix}Technique"><option value="">Alle</option>${actions.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Rotation <select id="${prefix}Rotation"><option value="">Alle</option>${rotations.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Satz <select id="${prefix}Set"><option value="">Alle</option>${[1,2,3,4,5].map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label></div></div></div>`;
}

export function resultShellHtml({content,compareContent='',compare=false}){
  return `<div class="card"><h3>Auswertung A</h3>${content}</div>${compare?compareContent:''}`;
}
