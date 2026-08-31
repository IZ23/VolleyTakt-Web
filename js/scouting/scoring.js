// VolleyTakt Live scoring domain.
// Pure helpers only: no DOM, storage, rendering, timers, camera or persistence access.

export function scorePointTransition({winner,scoreUs=0,scoreThem=0,servingSide='',forceSideout=false}={}){
  if(winner!=='us'&&winner!=='them')throw new TypeError('winner must be us or them');
  const before=forceSideout?(winner==='us'?'them':'us'):(servingSide||'');
  const sideout=!!before&&before!==winner;
  return {
    scoreUs:Math.max(0,+scoreUs||0)+(winner==='us'?1:0),
    scoreThem:Math.max(0,+scoreThem||0)+(winner==='them'?1:0),
    servingBefore:before,
    servingAfter:winner,
    sideout
  };
}

export function winningSideForTarget(scoreUs=0,scoreThem=0,target=25){
  const us=Math.max(0,+scoreUs||0),them=Math.max(0,+scoreThem||0),need=Math.max(1,+target||25);
  if(Math.max(us,them)<need||Math.abs(us-them)<2)return '';
  return us>them?'us':'them';
}

export function setWinTransition({winner,setWinsUs=0,setWinsThem=0}={}){
  if(winner!=='us'&&winner!=='them')throw new TypeError('winner must be us or them');
  return {
    setWinsUs:Math.max(0,+setWinsUs||0)+(winner==='us'?1:0),
    setWinsThem:Math.max(0,+setWinsThem||0)+(winner==='them'?1:0)
  };
}
